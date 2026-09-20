---
title: 使用cloudflare+github搭建免费床图
date: 2026-08-18 21:02:56
tags:
  - 项目
  - cloudflare
categories: Cloudflare
---

# 使用cloudflare+github搭建免费床图

> 虽然说市面上已经有非常非常多的这样的床图项目了，但是我习惯了彩虹云外链网盘的那样的界面，于是我就用ai吧这个项目移植到了cloudflareworker上面

## 准备工作

一个cloudflare账号
一个GitHub账号
一个脑子（最重要的）

## fork项目

打开[https://github.com/fanchuanhaha/cf-pan/](https://github.com/fanchuanhaha/cf-pan/)

点击右上方fork按钮 fork到你自己那里

## 配置信息

然后来到cloudflare主页 复制上方地址内你的账户ID
例如
https://dash.cloudflare.com/6fd11v1vh19b82ef98gkgk2gd7cca5c2b/home

就复制6fd11v1vh19b82ef98gkgk2gd7cca5c2b

然后返回GitHub，点击刚刚fork了的项目的上面的settings左边找到secrets and variables 点击actions，点击New repository secret
Name那里输入`CLOUDFLARE_ACCOUNT_ID` 下面粘贴你刚刚复制的cf的id 返回cf，点击右上角头像，点击配置文件，点击左侧API令牌，点击创建令牌，点击编辑 Cloudflare Workers旁边的使用模板，权限那里添加更多，选择D1 权限改成编辑，下方两个都改成全部账户全部区域，点击下方创建令牌，复制你的令牌，来到GitHub，再点击New repository secret，name输入`CLOUDFLARE_API_TOKEN` 下方粘贴你刚刚复制的，点击上方action，点击我同意，点击左侧部署到cloudflareworkers，点击右边run workflow，弹出来的里面再点击runworkflow等待运行完成，来到cf 点击左边计算，点击workers和pages，点击新出来的pan-workers，点击给出的链接(打不开就开魔法）

## 全新安装

然后点击全新安装，输入管理员账号密码，下面选择GitHub的，然后来到访问[https://github.com/new](https://github.com/new)  随便输入一个仓库名称，这个是用来存储你网盘的文件的（好想是最高只支持50mb）当然你可以配置其他存储，下面你想你仓库可以被人看到 Choose visibility就选public不想就选private,然后点击右上角头像，点击settings，在右侧点击Developer settings点击Personal access tokens点击Tokens (classic)点击Generate new token点击Generate new token (classic)
输入你GitHub的密码，然后随便输入个名称，Expiration选择No expiration，勾上repo权限，滑到下面点击Generate token，复制得到的密钥，返回网站粘贴到第三个那，然后测试确认并完成。
这样就搭建完成了

## 从备份恢复

老 PHP 站点的数据和文件可以直接整体搬过来，不用手动重新传文件。流程是：

* 把 [rec.php](https://raw.githubusercontent.com/fanchuanhaha/cf-pan/refs/heads/main/rec.php) 上传到原站点更目录
  访问新网站选择从备份恢复，输入原站点地址和管理员账号密码，获取到原站点信息，然后配置新存储，然后会跳转原站点的rec.php进行恢复
  
  这个项目只是我已经习惯了彩虹云外链网盘那样的界面，其实GitHub上面已经有非常多这样的项目的了
  欢迎加入交流：https://qm.qq.com/q/DTMDzZNZPa

