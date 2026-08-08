# GitHub Pages 发布说明

## 当前公网地址

- 网站：`https://kimye777.github.io/miaoyansong-portfolio/`
- 公开仓库：`https://github.com/KimYe777/miaoyansong-portfolio`
- 发布分支：`main`
- 发布目录：仓库根目录

## 公开范围

公开仓库只存放 `npm run build` 生成的成品网页，以及网站运行所需的作品集图片、交互原型和 3D 模型。

React / TypeScript 源码、设计规范、项目文档、测试脚本和制作过程文件仅保存在本地项目，不上传到公开仓库。

## 后续更新流程

1. 在本地原项目中修改内容或功能。
2. 运行 `npm run build`。
3. 用新的 `dist` 内容同步公开仓库，保留 `.nojekyll`。
4. 提交并推送公开仓库的 `main` 分支。
5. 等待 GitHub Pages 构建完成，复测桌面端、手机端、交互原型和模型资源。

后续更新沿用同一仓库和网址，无需重新创建网站。
