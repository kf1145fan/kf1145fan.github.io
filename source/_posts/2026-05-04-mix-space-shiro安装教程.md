---
title: mix-space-shiro安装教程
date: 2026-05-04T14:04:44.637Z
tags:
  - 服务器
  - 教程
categories: 服务器
---

# 前言


这真的就是给那个方法给你嚼碎了喂你的再看不懂我也没办法（到时候会出一期教程视频）
参考资料

https://mx-space.js.org/docs/core

https://blog.xp6.top/posts/%E4%BA%91%E6%9C%8D%E5%8A%A1%E5%99%A8/91

首先你需要有一台云服务器，这里我推荐`“狐蒂云”`

注册链接：https://www.szhdy.com/aff/IGBTWUUW

注册后你可以去购买云服务，他家活动时不时就有非常有性价比的产品出现

然后你会获得一个ip地址和一个ssh密码，我们可以用finalshell链接

finalshell下载链接：https://dl.hostbuf.com/finalshell3/finalshell_windows_x64.exe

手机可以用`serverbox`

# 准备

**一台服务器**

**一个域名**

**一个ssh连接工具**

# 教程

## 连接服务器

打开finalshell，点击上方文件样子的图标，点击添加图标，选ssh链接将云服务器提供商的参数填进去，然后确认返回，点击即刚刚新建的连接上服务器，点击接受和保存

![](https://tp.802213.xyz/uploads/SnowShot_2026-05-03_21-32-21.png)

## 安装宝塔and所需软件

输入以下命令先安装宝塔面板

![](https://tp.802213.xyz/uploads/SnowShot_2026-05-02_12-51-00.png)

```bash
if [ -f /usr/bin/curl ];then curl -sSO https://download.bt.cn/install/install_panel.sh;else wget -O install_panel.sh https://download.bt.cn/install/install_panel.sh;fi;bash install_panel.sh ed8484bec
```


等待期安装完成

访问所给出的面板往外网访问地址（若你的云服务商开了防火墙，记得放行端口）


![](https://tp.802213.xyz/uploads/SnowShot_2026-05-02_12-14-01.png)

复制账号密码进去然后登陆

滑倒最下然后同意协议

![](https://tp.802213.xyz/uploads/SnowShot_2026-05-02_13-05-52.png)

点击暂不绑定（当然你有的花也可以绑定）

点击下方这个极速安装，如果你想快点可以只勾选nginx


![](https://tp.802213.xyz/uploads/SnowShot_2026-05-02_13-37-08.png)

等待安装完成


![](https://tp.802213.xyz/uploads/SnowShot_2026-05-02_13-38-11.png)

![](https://tp.802213.xyz/uploads/SnowShot_2026-05-02_13-54-26.png)

返回点击左侧的docker


![](https://tp.802213.xyz/uploads/SnowShot_2026-05-02_15-13-38.png)

![](https://tp.802213.xyz/uploads/SnowShot_2026-05-02_15-15-55.png)![](https://tp.802213.xyz/uploads/SnowShot_2026-05-02_15-18-33.png)等待期安装完成（有可能出现successful但是不会关闭，你自己关了就好）
## 执行安装脚本
回到finalshell

输入


![](https://tp.802213.xyz/uploads/SnowShot_2026-05-03_22-16-14.png)
```bash <(curl -LsS sh.802213.xyz/mx.sh)
bash <(curl -LsS sh.802213.xyz/mx.sh)


```

这个是我照着教程拿ai写的：（
感谢ZXEB大佬提供的修复后的shiro的启动文件

这里输入的是你的`后端域名`
等待执行到这一步

![](https://tp.802213.xyz/uploads/SnowShot_2026-05-03_22-07-07.png)


## 配置反向代理
回到宝塔面板，现在来配置反向代理
这里的域名填你刚刚输入的`后端域名`

目标填`http://127.0.0.1:2333`
![](https://tp.802213.xyz/uploads/SnowShot_2026-05-02_17-09-05.png)

然后配置ssl

![](https://tp.802213.xyz/uploads/SnowShot_2026-05-03_22-52-20.png)

![](https://tp.802213.xyz/uploads/SnowShot_2026-05-03_12-04-37.png)

![](https://tp.802213.xyz/uploads/SnowShot_2026-05-03_12-08-03.png)

![](https://tp.802213.xyz/uploads/SnowShot_2026-05-02_17-26-23.png)

然后新建一个浏览器窗口，打开你的后端地址/proxy/qaqdmin

## 登陆后端及配置

随后进行配置

![](https://tp.802213.xyz/uploads/SnowShot_2026-05-02_17-53-20.png)
按你的需求填
![](https://tp.802213.xyz/uploads/SnowShot_2026-05-02_18-03-43.png)

![](https://tp.802213.xyz/uploads/SnowShot_2026-05-02_18-05-41.png)![](https://tp.802213.xyz/uploads/SnowShot_2026-05-02_18-06-26.png)点击link start

然后输入你刚刚设的密码

![](https://tp.802213.xyz/uploads/SnowShot_2026-05-02_18-08-11.png)

这样就成功进到后端了

![](https://tp.802213.xyz/uploads/SnowShot_2026-05-03_09-10-37.png)
现在配置云函数（给前端看的）
![](https://tp.802213.xyz/uploads/SnowShot_2026-05-03_09-13-06.png)

新建如下

![](https://tp.802213.xyz/uploads/SnowShot_2026-05-03_09-19-02.png)

![](https://tp.802213.xyz/uploads/SnowShot_2026-05-03_09-21-13.png)

删除全部替换下面的


复制粘贴下面的（不要照抄更具自己的修改）

```json
{
  "footer": {
    "otherInfo": {
      "date": "2020-{{now}}",
      "icp": {
        "text": "萌 ICP 备 20236136 号",
        "link": "https://icp.gov.moe/?keyword=20236136"
      }
    },
    "linkSections": [
      {
        "name": "关于",
        "links": [
          {
            "name": "关于本站",
            "href": "/about-site"
          },
          {
            "name": "关于我",
            "href": "/about"
          },
          {
            "name": "关于此项目",
            "href": "https://github.com/innei/Shiro",
            "external": true
          }
        ]
      },
      {
        "name": "更多",
        "links": [
          {
            "name": "时间线",
            "href": "/timeline"
          },
          {
            "name": "友链",
            "href": "/friends"
          },
          {
            "name": "监控",
            "href": "https://status.innei.in/status/main",
            "external": true
          }
        ]
      },
      {
        "name": "联系",
        "links": [
          {
            "name": "写留言",
            "href": "/message"
          },
          {
            "name": "发邮件",
            "href": "mailto:i@innei.ren",
            "external": true
          },
          {
            "name": "GitHub",
            "href": "https://github.com/innei",
            "external": true
          }
        ]
      }
    ]
  },
  "config": {
    "color": {
      "light": [
        "#33A6B8",
        "#FF6666",
        "#26A69A",
        "#fb7287",
        "#69a6cc",
        "#F11A7B",
        "#78C1F3",
        "#FF6666",
        "#7ACDF6"
      ],
      "dark": [
        "#F596AA",
        "#A0A7D4",
        "#ff7b7b",
        "#99D8CF",
        "#838BC6",
        "#FFE5AD",
        "#9BE8D8",
        "#A1CCD1",
        "#EAAEBA"
      ]
    },

    "bg": [
      "https://github.com/Innei/static/blob/master/images/F0q8mwwaIAEtird.jpeg?raw=true",
      "https://github.com/Innei/static/blob/master/images/IMG_2111.jpeg.webp.jpg?raw=true"
    ],
    "custom": {
      "css": [],
      "styles": [],
      "js": [],
      "scripts": []
    },
    "site": {
      "favicon": "/innei.svg",
      "faviconDark": "/innei-dark.svg"
    },
    "hero": {
      "title": {
        "template": [
          {
            "type": "h1",
            "text": "Hi, I'm ",
            "class": "font-light text-4xl"
          },
          {
            "type": "h1",
            "text": "Innei",
            "class": "font-medium mx-2 text-4xl"
          },
          {
            "type": "h1",
            "text": "👋。",
            "class": "font-light text-4xl"
          },
          {
            "type": "br"
          },
          {
            "type": "h1",
            "text": "A NodeJS Full Stack ",
            "class": "font-light text-4xl"
          },
          {
            "type": "code",
            "text": "<Developer />",
            "class": "font-medium mx-2 text-3xl rounded p-1 bg-gray-200 dark:bg-gray-800/0 hover:dark:bg-gray-800/100 bg-opacity-0 hover:bg-opacity-100 transition-background duration-200"
          },
          {
            "type": "span",
            "class": "inline-block w-[1px] h-8 -bottom-2 relative bg-gray-800/80 dark:bg-gray-200/80 opacity-0 group-hover:opacity-100 transition-opacity duration-200 group-hover:animation-blink"
          }
        ]
      },
      "description": "An independent developer coding with love."
    },
    "module": {
      "activity": {
        "enable": true,
        "endpoint": "/fn/ps/update"
      },
      "donate": {
        "enable": true,
        "link": "https://afdian.net/@Innei",
        "qrcode": [
          "https://cdn.jsdelivr.net/gh/Innei/img-bed@master/20191211132347.png",
          "https://cdn.innei.ren/bed/2023/0424213144.png"
        ]
      },
      "bilibili": {
        "liveId": 1434499
      }
    }
  }
}
```


保存

![](https://tp.802213.xyz/uploads/SnowShot_2026-05-03_11-15-03.png)

然后回到终端继续执行安装

![](https://tp.802213.xyz/uploads/SnowShot_2026-05-03_22-07-07.png)

等待期安装完成

返回宝塔面本，配置前端的代理

和后端一样的步骤

![](https://tp.802213.xyz/uploads/SnowShot_2026-05-03_12-23-47.png)![](https://tp.802213.xyz/uploads/SnowShot_2026-05-03_12-08-03.png)![](https://tp.802213.xyz/uploads/SnowShot_2026-05-03_12-04-37.png)

之后访问你的前端域名，即可成功访问网站

有不懂得欢迎加入q群262195311讨论