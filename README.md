# AI探究导师 - 酵母菌呼吸作用实验

一个集成AI的交互式科学探究实验模拟器，引导学生完成酵母菌呼吸作用的探究实验。

## 功能特点

- 🤖 **AI引导**：集成DeepSeek API，使用苏格拉底式提问引导学生探究
- 🧪 **实验模拟**：可视化的实验装置，包含量筒、气球、气泡动画
- 📊 **数据记录**：实时记录和验证实验数据
- 🎛️ **参数控制**：温度滑块，支持设置5组不同温度
- ⏱️ **时间加速**：16秒模拟8小时实验过程

## 快速开始

### 安装依赖

```bash
npm install
```

### 本地开发

```bash
npm run dev
```

访问 http://localhost:5173

### 构建部署

```bash
npm run build
```

## 技术栈

- **构建工具**：Vite
- **前端**：Vanilla JavaScript + CSS
- **AI服务**：DeepSeek API
- **部署**：Vercel

## 项目结构

```
ai-inquiry-tutor/
├── index.html          # 主入口
├── src/
│   ├── style.css       # 样式文件
│   ├── config.js       # 配置文件（API key等）
│   ├── main.js         # 主逻辑
│   ├── simulator.js    # 实验模拟器
│   ├── materials.js    # 材料组件
│   └── ai-chat.js      # AI对话模块
├── vercel.json         # Vercel部署配置
└── README.md
```

## 实验流程

1. **问题聚焦**：从生活场景引入，提出探究问题
2. **准备材料**：酵母菌、水、糖、量筒、气球、皮筋
3. **设置变量**：
   - 自变量：温度（5组不同温度）
   - 因变量：气体体积
   - 控制变量：酵母菌/糖/水的用量
4. **预测结果**：学生预测实验结果
5. **运行实验**：16秒模拟8小时发酵过程
6. **记录数据**：精确记录气体体积（保留2位小数）
7. **得出结论**：分析数据，总结规律

## 气体体积计算公式

```javascript
// 25°C ≤ 温度 ≤ 50°C
气体体积 = 0.2 * 温度 * 时间 (ml)

// 温度 > 50°C（酵母菌失活）
气体体积 = 0

// 温度 < 25°C（低温抑制）
气体体积 = 0.02 * 温度 * 时间 (ml)
```

## 配置

在 `src/config.js` 中配置API密钥：

```javascript
export const config = {
  api: {
    baseUrl: 'https://api.deepseek.com/v1/chat/completions',
    apiKey: 'your-api-key-here',
    model: 'deepseek-chat',
  },
  // ...
};
```

## 许可证

MIT
