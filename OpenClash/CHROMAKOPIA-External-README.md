# CHROMAKOPIA 外部转换模板

适用于 SubConverter-Extended；已在 api.asailor.org 用虚构节点验证 HTTP 200，2026-10-22。

## 配置订阅

在 OpenClash「编辑订阅」中：

- 订阅地址：保留你自己的机场订阅，仅保存在路由器。
- 在线订阅转换：开启，后端 api.asailor.org。
- 订阅转换模板：自定义模板。
- 自定义模板地址填写下面的 INI 原文链接，而不是 GitHub 网页链接或完整 YAML：

https://raw.githubusercontent.com/anybodyiskiller-cpu/Profile/main/OpenClash/CHROMAKOPIA-External.ini

该 INI 通过 clash_rule_base 引用之前生成的完整 YAML，并设置 enable_rule_generator=false、overwrite_original_rules=false，因此保留全部基础参数、61 条规则和 52 个 rule-providers；再根据机场节点生成 37 个策略组。区域组按名称匹配，并排除原配置指定的 5x/10x；空区域组具有 REJECT 候选。多机场归属不隔离，两个原节点池组都会收集传入节点。Ponte 仍只有 REJECT / DIRECT，没有远程隧道节点。

INI 不包含订阅链接、实际节点或真实凭据。原 YAML 同样不含这些内容；API secret 是公开占位符，应在路由器本地设置。

## 恢复策略组图标和动态收集

转换器源码中的策略组结构没有 icon 字段，重建策略组会移除原 YAML 的图标。因此需要配套模块：

https://raw.githubusercontent.com/anybodyiskiller-cpu/Profile/main/OpenClash/CHROMAKOPIA-Groups.conf

操作顺序：OpenClash「运行状态」顶部「覆写模块」→ 弹出窗口 →「添加新模块」→「订阅链接」→ 填入上述 Groups.conf 地址 → 检查匹配配置文件 → 添加、启用并重启插件。

模块默认匹配 `/etc/openclash/config/ᴄʜʀᴏᴍᴀᴋᴏᴘɪᴀ.yaml`，与本次观察到的配置名称一致。如果配置名称不同，请在添加模块时修改为实际配置的完整路径。新模块默认关闭；添加后需要启用及重启才生效。

模块以 [YAML] 段的 proxy-groups! 完整恢复 37 个策略组和原图标，并按节点名称自动收集当前 proxies / proxy-providers。空区域组设置 empty-fallback: REJECT。它会覆盖其他模块对此 37 组所做的修改，修改分组时应同步维护本模块。

模块同时明确写入字符串形式的 find-process-mode: 'off'，避免转换器重新输出 off 后，Ruby YAML 1.1 解析时将它变成布尔值。

## 已完成验证

- api.asailor.org：7 个使用 192.0.2.0/24 文档地址的虚构 SS 节点转换成功，HTTP 200；没有传送真实机场订阅。
- 输出节点数 7、组数 37；主规则和规则集合与原 YAML 逐项一致。
- 日本测试节点进入日本组，JP 10x 测试节点被排除；无韩国节点时韩国组为 REJECT。
- 原始转换输出通过 Mihomo Meta v1.19.33 配置检查。
- 按模块恢复策略组和进程匹配字符串后的配置通过同一内核检查。
- 图标 URL 保持原值；未逐张检查图标可达性，未用虚构节点测试联网，也未更改路由器设置。

## 来源

- [后端外部配置格式](https://github.com/Aethersailor/SubConverter-Extended/wiki/External-Configuration)
- [后端官方 INI 示例](https://github.com/Aethersailor/SubConverter-Extended/blob/master/base/config/example_external_config.ini)
- [后端策略组生成源码](https://github.com/Aethersailor/SubConverter-Extended/blob/master/src/generator/config/subexport.cpp)
- [OpenClash 覆写模块指南 §16.1、§16.2](https://raw.githubusercontent.com/vernesong/OpenClash/dev/.github/skills/openclash-user-guide/16-overwrite-module-format.md)

补充更正：该后端官方文档说明可识别部分 GitHub blob URL，因此先前不能单凭 blob 网页形式断定根因。完整 Mihomo YAML 被当作转换器外部配置，是已确认的格式不匹配；本次 INI 已通过真实后端转换验证。
