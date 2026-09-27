/**
 * 极简 SMTP 客户端（基于 Cloudflare Workers TCP Sockets）。
 *
 * 重要限制：Workers 的 sockets API 只支持「明文(off)」与「隐式 TLS(on)」两种传输，
 * 不支持 STARTTLS。所以请使用 465 端口（隐式 TLS）；587 端口在 Workers 上无法使用。
 *
 * 支持 AUTH LOGIN（QQ/163/Gmail/企业邮箱等主流服务商的授权码登录均走此方式）。
 */

import { connect } from "cloudflare:sockets";

export interface SmtpConfig {
	host: string;
	port: number;
	user: string;
	pass: string;
	fromName?: string;
	fromEmail?: string;
}

export interface MailOptions {
	to: string;
	subject: string;
	text?: string;
	html?: string;
}

// UTF-8 安全的 base64 编码（btoa 直接处理非 Latin1 会抛错）
function base64(input: string): string {
	const bytes = new TextEncoder().encode(input);
	let bin = "";
	for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
	return btoa(bin);
}

// 邮件头编码：非 ASCII 用 RFC2047 Base64（=?UTF-8?B?...?=）
function encodeHeader(value: string): string {
	// eslint-disable-next-line no-control-regex
	if (/^[\x20-\x7e]*$/.test(value)) return value;
	return "=?UTF-8?B?" + base64(value) + "?=";
}

function buildMime(cfg: SmtpConfig, msg: MailOptions): string {
	const fromEmail = cfg.fromEmail || cfg.user;
	const from = cfg.fromName
		? encodeHeader(cfg.fromName) + " <" + fromEmail + ">"
		: fromEmail;
	const body = msg.html || msg.text || "";
	const header = [
		"From: " + from,
		"To: " + msg.to,
		"Subject: " + encodeHeader(msg.subject),
		"MIME-Version: 1.0",
		"Content-Type: " +
			(msg.html ? "text/html" : "text/plain") +
			"; charset=UTF-8",
		"Content-Transfer-Encoding: base64",
		"",
	].join("\r\n");
	// 正文按 76 字符折行（SMTP 行长度限制）
	const payload = base64(body).replace(/(.{76})/g, "$1\r\n");
	return header + "\r\n" + payload;
}

function withTimeout<T>(p: Promise<T>, ms: number, label: string): Promise<T> {
	return Promise.race([
		p,
		new Promise<T>((_, reject) =>
			setTimeout(() => reject(new Error(label + "超时（" + ms + "ms）")), ms),
		),
	]);
}

/**
 * 发送一封邮件。失败会抛出带原因的 Error。
 */
export async function sendMail(
	cfg: SmtpConfig,
	msg: MailOptions,
	timeoutMs = 20000,
): Promise<void> {
	if (!cfg.host || !cfg.port) throw new Error("SMTP 未配置（缺少服务器或端口）");
	if (!msg.to) throw new Error("缺少收件人");

	const socket = connect(
		{ hostname: cfg.host, port: cfg.port },
		{ secureTransport: "on", allowHalfOpen: false },
	);
	const reader = socket.readable.getReader();
	const writer = socket.writable.getWriter();
	const enc = new TextEncoder();
	const dec = new TextDecoder();
	let buf = "";

	const codeOf = (reply: string): number => {
		const m = /^([0-9]{3})/.exec(reply.trim());
		return m ? parseInt(m[1], 10) : 0;
	};

	// 读取一条完整 SMTP 回复（多行时以「CODE 空格」结束）
	async function readReply(ms = timeoutMs): Promise<string> {
		const end = Date.now() + ms;
		for (;;) {
			const lines = buf.split("\r\n");
			for (let i = 0; i < lines.length; i++) {
				const m = /^([0-9]{3})([ -])/.exec(lines[i]);
				if (m && m[2] === " ") {
					const reply = lines.slice(0, i + 1).join("\n");
					buf = lines.slice(i + 1).join("\r\n");
					return reply;
				}
			}
			const remain = end - Date.now();
			if (remain <= 0) throw new Error("SMTP 响应超时");
			const chunk = await withTimeout(reader.read(), remain, "SMTP 读取");
			if (chunk.done) throw new Error("SMTP 连接被服务器关闭");
			buf += dec.decode(chunk.value, { stream: true });
		}
	}

	async function cmd(line: string): Promise<string> {
		await writer.write(enc.encode(line + "\r\n"));
		return readReply();
	}

	async function expect(line: string, okCodes: number[], what: string): Promise<string> {
		const reply = await cmd(line);
		if (!okCodes.includes(codeOf(reply))) {
			throw new Error(what + "失败：" + reply.replace(/\n/g, " | "));
		}
		return reply;
	}

	const fromEmail = cfg.fromEmail || cfg.user;
	const ehloName = (fromEmail.split("@")[1] || "localhost").trim();

	try {
		await withTimeout(socket.opened, timeoutMs, "SMTP 连接");
		const banner = await readReply();
		if (codeOf(banner) !== 220) {
			throw new Error("SMTP 服务不可用：" + banner.replace(/\n/g, " | "));
		}

		await expect("EHLO " + ehloName, [250], "EHLO");

		// 认证：优先 AUTH LOGIN
		if (cfg.user && cfg.pass) {
			const auth = await cmd("AUTH LOGIN");
			const ac = codeOf(auth);
			if (ac === 334) {
				await expect(base64(cfg.user), [334], "AUTH 用户名");
				const pr = await cmd(base64(cfg.pass));
				if (codeOf(pr) !== 235) {
					throw new Error(
						"SMTP 登录失败（账号或密码/授权码错误）：" + pr.replace(/\n/g, " | "),
					);
				}
			} else if (ac !== 235) {
				throw new Error(
					"SMTP 服务器不支持 AUTH LOGIN：" + auth.replace(/\n/g, " | "),
				);
			}
		}

		await expect("MAIL FROM:<" + fromEmail + ">", [250], "MAIL FROM");
		await expect("RCPT TO:<" + msg.to + ">", [250, 251], "RCPT TO");
		await expect("DATA", [354], "DATA");

		await writer.write(enc.encode(buildMime(cfg, msg) + "\r\n.\r\n"));
		const sent = await readReply();
		if (codeOf(sent) !== 250) {
			throw new Error("邮件投递失败：" + sent.replace(/\n/g, " | "));
		}
		try {
			await cmd("QUIT");
		} catch (e) {
			/* QUIT 失败无妨 */
		}
	} finally {
		try {
			writer.releaseLock();
		} catch (e) {
			/* ignore */
		}
		try {
			reader.releaseLock();
		} catch (e) {
			/* ignore */
		}
		try {
			await socket.close();
		} catch (e) {
			/* ignore */
		}
	}
}