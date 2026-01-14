// AI探究导师 - 主入口文件

import './style.css';
import { config } from './config.js';
import { MaterialsManager, MATERIALS } from './materials.js';
import { Simulator, ExperimentStatus, ASSEMBLY_STEPS } from './simulator.js';
import { AIChatManager } from './ai-chat.js';

// 场景图片（使用placeholder，可以替换为真实图片）
const SCENE_IMAGE = 'data:image/svg+xml,' + encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 250">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" style="stop-color:#fef3c7"/>
      <stop offset="100%" style="stop-color:#fde68a"/>
    </linearGradient>
  </defs>
  <rect width="400" height="250" fill="url(#bg)"/>
  <!-- 厨房背景 -->
  <rect x="0" y="180" width="400" height="70" fill="#8b4513"/>
  <rect x="20" y="150" width="360" height="35" fill="#d2691e" rx="5"/>
  <!-- 面团 -->
  <ellipse cx="200" cy="140" rx="60" ry="40" fill="#f5deb3"/>
  <ellipse cx="200" cy="135" rx="55" ry="35" fill="#ffe4b5"/>
  <!-- 酵母菌包装 -->
  <rect x="280" y="120" width="40" height="50" fill="#228b22" rx="3"/>
  <text x="300" y="150" text-anchor="middle" fill="white" font-size="8">酵母</text>
  <!-- 碗 -->
  <ellipse cx="100" cy="155" rx="45" ry="20" fill="#4a4a4a"/>
  <ellipse cx="100" cy="150" rx="40" ry="15" fill="#6a6a6a"/>
  <!-- 太阳/温暖 -->
  <circle cx="350" cy="50" r="30" fill="#fbbf24"/>
  <text x="350" y="55" text-anchor="middle" fill="#92400e" font-size="12">☀️</text>
  <!-- 文字说明 -->
  <text x="200" y="220" text-anchor="middle" fill="#78350f" font-size="14" font-family="sans-serif">
    妈妈把面团放到温暖的地方发酵...
  </text>
</svg>
`);

// 主应用类
class App {
  constructor() {
    // 初始化各模块
    this.materials = new MaterialsManager('materialsContainer');
    this.simulator = new Simulator();
    this.aiChat = new AIChatManager();
    
    // 绑定模块间的交互
    this.bindModuleInteractions();
    
    // 启动应用
    this.init();
  }

  // 初始化
  init() {
    console.log('🔬 AI探究导师已启动');
    
    // 初始材料区为空（AI引导后再显示）
    this.materials.clear();
    
    // 初始数据区表格为空
    this.updateDataTableDisplay({ showTemp: false, showVolume: false });
    
    // 开始AI对话
    setTimeout(() => {
      this.aiChat.startConversation();
    }, 500);
  }
  
  // 更新数据表格显示
  updateDataTableDisplay({ showTemp = false, showVolume = false }) {
    const tbody = document.getElementById('dataTableBody');
    tbody.innerHTML = '';
    
    if (showTemp) {
      const tempRow = document.createElement('tr');
      const temps = this.simulator.getTemperatures();
      tempRow.innerHTML = `
        <td>温度(°C)</td>
        <td id="temp-1">${temps[0]}</td>
        <td id="temp-2">${temps[1]}</td>
        <td id="temp-3">${temps[2]}</td>
        <td id="temp-4">${temps[3]}</td>
        <td id="temp-5">${temps[4]}</td>
      `;
      tbody.appendChild(tempRow);
    }
    
    if (showVolume) {
      const volumeRow = document.createElement('tr');
      volumeRow.innerHTML = `
        <td>气体体积(ml)</td>
        <td><input type="text" class="volume-input" id="volume-1" disabled></td>
        <td><input type="text" class="volume-input" id="volume-2" disabled></td>
        <td><input type="text" class="volume-input" id="volume-3" disabled></td>
        <td><input type="text" class="volume-input" id="volume-4" disabled></td>
        <td><input type="text" class="volume-input" id="volume-5" disabled></td>
      `;
      tbody.appendChild(volumeRow);
      
      // 重新绑定数据输入验证
      this.bindVolumeInputValidation();
    }
  }

  // 绑定模块间交互
  bindModuleInteractions() {
    // 处理AI发出的指令
    this.aiChat.onCommand = (cmd) => this.handleAICommand(cmd);
    
    // 处理用户消息，注入实际数据
    this.aiChat.onUserMessage = (message) => this.handleUserMessage(message);
    
    // 温度变化时
    this.simulator.onTemperatureChange = (temps) => {
      console.log('温度变化:', temps);
    };
    
    // 实验开始时
    this.simulator.onExperimentStart = () => {
      console.log('实验开始');
    };
    
    // 实验进行中
    this.simulator.onExperimentTick = (hours, volumes) => {
      console.log(`实验进行中: ${hours}小时, 气体体积:`, volumes);
    };
    
    // 实验完成时
    this.simulator.onExperimentComplete = (volumes) => {
      console.log('实验完成，最终气体体积:', volumes);
      // 启用数据输入
      this.simulator.enableVolumeInputs(true);
      // AI引导记录数据
      this.promptDataRecording();
    };
    
    // 控制按钮点击
    this.simulator.onControlButtonClick = (button) => {
      console.log('按钮点击:', button);
    };
    
    // 材料点击
    this.materials.onMaterialClick = (id) => {
      console.log('材料点击:', id);
    };
    
    // 材料放置回调
    this.simulator.onMaterialDropped = (result) => {
      this.handleMaterialDropResult(result);
    };
    
    // 绑定数据输入验证
    this.bindVolumeInputValidation();
  }
  
  // 处理材料放置结果
  handleMaterialDropResult(result) {
    console.log('材料放置结果:', result);
    
    if (result.success) {
      // 标记材料为已使用
      this.materials.markAsUsed(result.material);
      
      if (result.isComplete) {
        // 第一组装置组装完成
        this.aiChat.addAIMessage('很好！你已经完成了第一组材料的组装 🎉');
        // 自动进入下一步
        setTimeout(() => {
          this.aiChat.getAIResponse();
        }, 1000);
      } else if (result.nextMaterial) {
        // 提示下一个材料
        this.materials.setExpectedMaterial(result.nextMaterial);
        const nextStep = ASSEMBLY_STEPS.find(s => s.material === result.nextMaterial);
        if (nextStep) {
          this.aiChat.addAIMessage(`好的！接下来，${nextStep.description}`);
        }
      }
    } else {
      // 放置错误，提示用户
      this.aiChat.addAIMessage(result.message);
    }
  }
  
  // 处理用户消息，在特定关键词时注入实际数据
  // 返回 { block: true, message: '...' } 来拦截消息并显示提示
  handleUserMessage(message) {
    const lowerMsg = message.toLowerCase();
    
    // 用户说"设置好了"时，验证并注入温度数据
    if (lowerMsg.includes('设置好') || lowerMsg.includes('设好了') || lowerMsg.includes('好了')) {
      const temps = this.simulator.getTemperatures();
      // 检查是否在设置温度阶段（温度滑块已显示）
      if (this.simulator.temperatureSlidersEnabled) {
        // 🔒 验证温度：必须至少有2个不同的值
        const uniqueTemps = new Set(temps);
        if (uniqueTemps.size < 2) {
          // 温度验证失败，拦截消息并提示用户
          return {
            block: true,
            message: '如果5组温度都一样，我们就无法比较不同温度的效果了。请设置至少2个不同的温度值，再告诉我"设置好了"。'
          };
        }
        
        // 验证通过，注入系统消息告诉AI当前温度
        const tempInfo = `[系统信息：用户设置的5个温度值分别为：${temps.join('°C, ')}°C，温度验证通过]`;
        this.aiChat.messages.push({ role: 'system', content: tempInfo });
        console.log('注入温度数据:', temps);
      }
    }
    
    // 用户说"记录好了"时，注入实验数据
    if (lowerMsg.includes('记录好') || lowerMsg.includes('填好') || lowerMsg.includes('记好了')) {
      const temps = this.simulator.getTemperatures();
      const volumes = this.simulator.getGasVolumes();
      // 注入实际实验数据
      const dataInfo = `[系统信息：实验数据如下 - 
装置1: 温度${temps[0]}°C, 气体体积${volumes[0]}ml
装置2: 温度${temps[1]}°C, 气体体积${volumes[1]}ml
装置3: 温度${temps[2]}°C, 气体体积${volumes[2]}ml
装置4: 温度${temps[3]}°C, 气体体积${volumes[3]}ml
装置5: 温度${temps[4]}°C, 气体体积${volumes[4]}ml]`;
      this.aiChat.messages.push({ role: 'system', content: dataInfo });
      console.log('注入实验数据:', { temps, volumes });
    }
  }

  // 处理AI指令
  handleAICommand(cmd) {
    console.log('执行AI指令:', cmd);
    
    switch (cmd.action) {
      case 'showSceneImage':
        // 在最后一条消息中添加图片
        const lastMsg = this.aiChat.messagesContainer.lastElementChild;
        if (lastMsg && !lastMsg.querySelector('img')) {
          const img = document.createElement('img');
          img.src = SCENE_IMAGE;
          img.alt = '妈妈发面的场景';
          img.style.marginTop = '12px';
          img.style.borderRadius = '8px';
          lastMsg.appendChild(img);
        }
        break;
        
      case 'showMaterials':
        this.materials.showMaterials(cmd.materials);
        break;
        
      case 'showTemperatureSliders':
        this.simulator.showTemperatureSliders();
        break;
        
      case 'enableTemperatureSliders':
        this.simulator.enableTemperatureSliders(cmd.enable);
        break;
        
      case 'assembleApparatus':
        this.simulator.assembleApparatus(cmd.index);
        break;
        
      case 'assembleAllApparatuses':
        for (let i = 0; i < config.ui.apparatusCount; i++) {
          this.simulator.assembleApparatus(i);
        }
        break;
        
      case 'enableStartButton':
        this.simulator.enableControlButtons({ start: true, pause: false, reset: true });
        break;
        
      case 'enableVolumeInputs':
        this.simulator.enableVolumeInputs(true);
        break;
        
      case 'showChoice':
        this.aiChat.showChoiceQuestion(
          cmd.question, 
          cmd.options, 
          (index, text) => {
            console.log('用户选择:', index, text);
            // 如果是预测问题，保存预测
            if (cmd.question.includes('预测')) {
              this.aiChat.saveUserPrediction({ index, text });
            }
          },
          cmd.autoNext === true  // 是否自动进入下一步
        );
        break;
        
      case 'showMultiChoice':
        // 多选题
        this.aiChat.showMultiChoiceQuestion(
          cmd.question,
          cmd.options,
          cmd.correctAnswers || [],
          (selectedIndices, selectedTexts) => {
            console.log('用户多选:', selectedIndices, selectedTexts);
          },
          cmd.autoNext === true
        );
        break;
        
      case 'showTempRow':
        // 显示温度行
        this.updateDataTableDisplay({ showTemp: true, showVolume: false });
        break;
        
      case 'showVolumeRow':
        // 显示体积行（同时保持温度行）
        this.updateDataTableDisplay({ showTemp: true, showVolume: true });
        break;
        
      case 'showFlowChart':
        // 显示流程图
        this.showFlowChart();
        break;
        
      case 'showMaterialsForExperiment':
        // 显示实验材料（包含搅拌棒）
        this.materials.showMaterials(['cylinder', 'water', 'yeast', 'sugar', 'stirringRod', 'balloon', 'rubberBand']);
        break;
        
      case 'startAssembly':
        // 启动组装模式
        this.startAssemblyMode();
        break;
        
      case 'waitForMaterial':
        // 等待用户拖动指定材料
        this.waitForMaterial(cmd.material);
        break;
        
      case 'assembleRemaining':
        // 自动组装剩余装置
        this.assembleRemainingApparatuses();
        break;
        
      default:
        console.warn('未知指令:', cmd.action);
    }
  }
  
  // 启动组装模式
  startAssemblyMode() {
    console.log('启动组装模式');
    // 启用材料区拖拽
    this.materials.enableDrag(true);
    // 启动模拟器组装模式
    this.simulator.startAssemblyMode();
    // 高亮第一个材料（量筒）
    this.materials.setExpectedMaterial('cylinder');
  }
  
  // 等待用户拖动指定材料
  waitForMaterial(materialId) {
    console.log('等待材料:', materialId);
    // 高亮期望的材料
    this.materials.setExpectedMaterial(materialId);
  }
  
  // 自动组装剩余装置
  assembleRemainingApparatuses() {
    console.log('自动组装剩余装置');
    // 禁用拖拽
    this.materials.enableDrag(false);
    this.materials.setExpectedMaterial(null);
    // 自动组装
    this.simulator.assembleRemainingApparatuses();
  }

  // 绑定数据输入验证
  bindVolumeInputValidation() {
    for (let i = 1; i <= config.ui.apparatusCount; i++) {
      const input = document.getElementById(`volume-${i}`);
      if (input) {
        input.addEventListener('blur', () => {
          if (input.value.trim() === '') return;
          
          const result = this.simulator.validateVolumeInput(i - 1, input.value);
          if (!result.valid) {
            // 显示错误提示
            this.aiChat.addAIMessage(result.message);
          }
        });
        
        input.addEventListener('keypress', (e) => {
          if (e.key === 'Enter') {
            input.blur();
          }
        });
      }
    }
  }

  // 显示流程图
  showFlowChart() {
    const flowChartSVG = `data:image/svg+xml,${encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 120">
  <defs>
    <linearGradient id="boxGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#3b82f6"/>
      <stop offset="100%" style="stop-color:#2563eb"/>
    </linearGradient>
  </defs>
  
  <!-- 步骤1 -->
  <rect x="10" y="35" width="90" height="50" rx="8" fill="url(#boxGrad)"/>
  <text x="55" y="55" text-anchor="middle" fill="white" font-size="11" font-weight="bold">1.提出问题</text>
  <text x="55" y="70" text-anchor="middle" fill="#bfdbfe" font-size="9">温度影响呼吸?</text>
  
  <!-- 箭头1 -->
  <path d="M105 60 L125 60" stroke="#10b981" stroke-width="3" fill="none"/>
  <polygon points="125,55 135,60 125,65" fill="#10b981"/>
  
  <!-- 步骤2 -->
  <rect x="140" y="35" width="90" height="50" rx="8" fill="url(#boxGrad)"/>
  <text x="185" y="55" text-anchor="middle" fill="white" font-size="11" font-weight="bold">2.设计实验</text>
  <text x="185" y="70" text-anchor="middle" fill="#bfdbfe" font-size="9">变量·材料·装置</text>
  
  <!-- 箭头2 -->
  <path d="M235 60 L255 60" stroke="#10b981" stroke-width="3" fill="none"/>
  <polygon points="255,55 265,60 255,65" fill="#10b981"/>
  
  <!-- 步骤3 -->
  <rect x="270" y="35" width="90" height="50" rx="8" fill="url(#boxGrad)"/>
  <text x="315" y="55" text-anchor="middle" fill="white" font-size="11" font-weight="bold">3.进行实验</text>
  <text x="315" y="70" text-anchor="middle" fill="#bfdbfe" font-size="9">观察·记录数据</text>
  
  <!-- 箭头3 -->
  <path d="M365 60 L385 60" stroke="#10b981" stroke-width="3" fill="none"/>
  <polygon points="385,55 395,60 385,65" fill="#10b981"/>
  
  <!-- 步骤4 -->
  <rect x="400" y="35" width="90" height="50" rx="8" fill="url(#boxGrad)"/>
  <text x="445" y="55" text-anchor="middle" fill="white" font-size="11" font-weight="bold">4.分析数据</text>
  <text x="445" y="70" text-anchor="middle" fill="#bfdbfe" font-size="9">发现规律</text>
  
  <!-- 箭头4 -->
  <path d="M495 60 L515 60" stroke="#10b981" stroke-width="3" fill="none"/>
  <polygon points="515,55 525,60 515,65" fill="#10b981"/>
  
  <!-- 步骤5 -->
  <rect x="530" y="35" width="60" height="50" rx="8" fill="#10b981"/>
  <text x="560" y="55" text-anchor="middle" fill="white" font-size="11" font-weight="bold">5.结论</text>
  <text x="560" y="70" text-anchor="middle" fill="#d1fae5" font-size="9">✓</text>
</svg>
    `)}`;
    
    // 在AI消息中添加流程图
    const lastMsg = this.aiChat.messagesContainer.lastElementChild;
    if (lastMsg) {
      const img = document.createElement('img');
      img.src = flowChartSVG;
      img.alt = '科学探究流程图';
      img.style.marginTop = '12px';
      img.style.borderRadius = '8px';
      img.style.width = '100%';
      lastMsg.appendChild(img);
    }
  }

  // 引导记录数据
  promptDataRecording() {
    const temps = this.simulator.getTemperatures();
    const volumes = this.simulator.getGasVolumes();
    
    setTimeout(() => {
      this.aiChat.addAIMessage(`太棒了！实验完成了 🎉

请观察每个装置上显示的气体体积，把数据记录到右侧的数据表格中。

**填好后请在对话框输入"记录好了"**

<<<{"action": "enableVolumeInputs"}>>>`);
      
      // 同时注入实际数据到消息历史，供AI后续使用
      const dataInfo = `[系统信息：实验已完成，实际数据如下 - 
装置1: 温度${temps[0]}°C, 气体体积${volumes[0].toFixed(2)}ml
装置2: 温度${temps[1]}°C, 气体体积${volumes[1].toFixed(2)}ml
装置3: 温度${temps[2]}°C, 气体体积${volumes[2].toFixed(2)}ml
装置4: 温度${temps[3]}°C, 气体体积${volumes[3].toFixed(2)}ml
装置5: 温度${temps[4]}°C, 气体体积${volumes[4].toFixed(2)}ml]`;
      this.aiChat.messages.push({ role: 'system', content: dataInfo });
    }, 1000);
  }
}

// 启动应用
document.addEventListener('DOMContentLoaded', () => {
  window.app = new App();
});
