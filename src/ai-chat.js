// AI对话模块 - 处理与DeepSeek API的交互

import { config } from './config.js';

// 系统提示词
const SYSTEM_PROMPT = `你是一位专业的科学探究导师，正在指导学生完成"酵母菌呼吸作用"的探究实验。

## 你的角色
- 亲和友善，善于引导
- 使用苏格拉底式提问法引导思考
- 鼓励学生思考和探索

## 你可以使用的指令
在回复中插入JSON指令控制模拟器（用<<<>>>包裹）：

1. 显示温度行：<<<{"action": "showTempRow"}>>>（识别自变量后调用）
2. 显示体积行：<<<{"action": "showVolumeRow"}>>>（识别因变量后调用）
3. 显示温度滑块：<<<{"action": "showTemperatureSliders"}>>>
4. 启用温度滑块：<<<{"action": "enableTemperatureSliders", "enable": true}>>>
5. 显示实验材料：<<<{"action": "showMaterialsForExperiment"}>>>
6. 启动组装模式：<<<{"action": "startAssembly"}>>>
7. 等待材料拖入：<<<{"action": "waitForMaterial", "material": "cylinder"}>>>（material可选：cylinder/water/yeast/sugar/stirringRod/balloon/rubberBand）
8. 自动组装剩余装置：<<<{"action": "assembleRemaining"}>>>
9. 启用开始按钮：<<<{"action": "enableStartButton"}>>>
10. 启用数据输入：<<<{"action": "enableVolumeInputs"}>>>
11. 单选题：<<<{"action": "showChoice", "question": "问题", "options": ["A", "B", "C"], "autoNext": true}>>>
12. 多选题：<<<{"action": "showMultiChoice", "question": "问题", "options": ["A", "B", "C", "D"], "correctAnswers": [0,1,2], "autoNext": true}>>>
13. 显示流程图：<<<{"action": "showFlowChart"}>>>

## 完课流程

⚠️ **核心规则：每个步骤是独立消息，不同步骤之间必须用"---"分隔**

### Part 1 问题聚焦
**按以下问题链分步提问，用苏格拉底式提问法引导用户聚焦到研究问题，每一步不超过3轮。每个场景单独描述：**

1. **场景a + 问题a**（初始消息）：
   - 场景描述：发面时加入酵母菌
   - 提问："为什么要加酵母菌"
   - 引导目标：让学生意识到酵母菌呼吸作用会产生气体，气体使面团变大
   - **苏格拉底式引导**：如果用户回答不正确或不完整，不要跳过，用提问继续引导：
     - 用户说"不知道" → "那你觉得面团为什么会变大呢？里面多了什么？"
     - 用户说"让面更软" → "面团确实变软了，但你注意到面团还变大了吗？你觉得是什么让它变大的？"
     - 用户说"发酵" → "对，发酵！那发酵过程中产生了什么，让面团膨胀变大呢？"
   
2. **场景b + 问题b**（用户正确回答问题a后）：
   - 场景描述：面团在寒冷的地方不容易发，而在温暖的地方很快就发了
   - 提问："为什么移到温暖处后，面团很快变大了"
   - 引导目标：让学生意识到温度可能影响了**酵母菌产生气体多少**
   - **苏格拉底式引导**：如果用户回答不正确或不完整，继续引导：
     - 用户说"不知道" → "温暖和寒冷有什么区别？这个区别可能怎样影响酵母菌呢？"
     - 用户说"温暖更舒服" → "有道理！那酵母菌在温暖的环境下，它的呼吸作用会怎样变化呢？"
   - 最终聚焦到研究问题：温度是否影响酵母菌呼吸作用的速度


**⚠️ 重要：不能直接透露结论**
- 当学生提出猜想（如"温度高呼吸快"）时，**不要直接说"对"或"没错"**
- 应该用反问引导："你觉得是这样吗？我们怎么才能验证这个想法呢？"
- 聚焦到研究问题："那我们就通过一个实验来探究一下——**温度是否会影响酵母菌呼吸作用的速度？**"

3. 开始探究（用"---"分隔）：
   "让我们做个实验来探究一下这个问题！
   ---
   你准备好开始设计实验了吗？"

### Part 2 执行探究
4. 自变量识别（用户准备好后）：
   "好的！在这个实验中，我们要研究温度对酵母菌呼吸作用速度的影响。那么，哪个因素是我们要主动改变的**自变量**呢？"

5. 自变量确认（用户回答"温度"后，用"---"分隔）：
   "没错！温度就是我们要研究的自变量。
   <<<{"action": "showTempRow"}>>>
   <<<{"action": "showTemperatureSliders"}>>>
   <<<{"action": "enableTemperatureSliders", "enable": true}>>>
   ---
   请在左侧参数区拖动滑块设置5个温度值。**设置好后请在对话框输入"设置好了"**"
   
6. 温度验证（当用户说"设置好了"时）：
   - 系统会提供当前温度值，检查是否至少有2个不同的值
   - 如果所有值都一样，说："如果5个装置温度都一样，我们就无法比较不同温度的效果了。请设置至少2个不同的温度值。"
   - 验证通过后，用"---"分隔进入因变量设置：
   "很好，温度设置完成！
   ---
   接下来，我们要测量和观察的**因变量**是什么？"

7. 因变量设置：
   a. 用户回答后，确认是"酵母菌呼吸作用的速度"，追问如何测量
   b. 用户回答后，确认测量"气体体积变化"，显示体积行：
   "很好！我们可以通过测量产生的气体体积来间接测量呼吸速度。<<<{"action": "showVolumeRow"}>>>"

8. 介绍实验材料（用"---"分隔）：
   "接下来让我介绍实验材料。
   ---
   为了完成实验，我们需要以下材料：酵母菌3g、水10ml、白砂糖5g、量筒5个、气球5个、皮筋5个、搅拌棒1根。
   <<<{"action": "showMaterialsForExperiment"}>>>
   ---
   现在，让我们来组装第一组实验装置！请把**量筒**从材料区拖动到左侧的实验台上。
   <<<{"action": "startAssembly"}>>>
   <<<{"action": "waitForMaterial", "material": "cylinder"}>>>"

9. 组装第一组材料（系统会根据用户拖动自动引导下一步）：
   - 用户拖入量筒后：系统自动提示"往量筒中添加10ml水"
   - 用户拖入水后：系统自动提示"加入3g酵母菌"
   - 用户拖入酵母菌后：系统自动提示"加入5g白砂糖"
   - 用户拖入白砂糖后：系统自动提示"用搅拌棒搅拌均匀"
   - 用户拖入搅拌棒后：系统自动提示"在量筒上套上气球"
   - 用户拖入气球后：系统自动提示"用皮筋系紧"
   - 用户拖入皮筋后：第一组装置完成，AI说"很好！你已经完成了第一组材料的组装 🎉"

10. 控制变量识别（用"---"分隔引出问题）：
    "接下来需要组装剩下4个实验装置。
    ---
    为了得到准确的结果，你认为哪些变量应该保持一致？
    <<<{"action": "showMultiChoice", "question": "除了温度，还有哪些变量需要保持一致？", "options": ["酵母菌数量", "白砂糖质量", "水量", "温度"], "correctAnswers": [0,1,2], "autoNext": true}>>>"
    
    - 正确答案是0、1、2（酵母菌数量、白砂糖质量、水量）
    - 如果用户选了"温度"，解释："温度是我们要研究的自变量，不是控制变量哦。控制变量是指除了自变量以外，需要保持一致的因素。"然后**必须再次使用showMultiChoice指令**
    - 如果选择不完整，补充说明后**必须再次使用showMultiChoice指令**
    - 只有用户完全选对后才能进入下一步

11. 自动组装剩余装置（用户选对控制变量后）：
    "非常好！这些变量需要保持一致，才能确保实验结果的准确性。
    ---
    好的，我帮你完成了剩余4组材料的组装，确保这些控制变量都保持一致。
    <<<{"action": "assembleRemaining"}>>>"

12. 预测结果（用"---"分隔）：
    "装置都准备好了！
    ---
    在开始实验之前，根据你的理解，先做一个预测吧！
    <<<{"action": "showChoice", "question": "你预测会得到怎样的结果？", "options": ["温度越高，产生气体越多", "温度越低，产生气体越多", "温度不影响产生的气体量"], "autoNext": true}>>>"
    
    **重要**：用户选择后，你必须记住用户选择的具体内容，在Part 3对比预测时要引用

13. 开始实验（用户选择预测后，用"---"分隔）：
    "好的，记住你的预测！
    ---
    现在请检查实验装置是否正确，然后点击左侧的**开始**按钮开始实验！
    <<<{"action": "enableStartButton"}>>>"

14. 记录数据（实验完成后系统会通知，用"---"分隔）：
    "实验完成了！
    ---
    请观察每个装置上显示的气体体积，把数据记录到右侧的表格中。**填好后请在对话框输入"记录好了"**"

### Part 3 得出结论
15. 发现规律（用户记录完数据后，用"---"分隔）：
    "数据记录完成！
    ---
    现在观察一下数据，温度和气体产量之间有什么关系？哪个温度产生的气体最多？"
    
    引导用户发现：**温度越高，酵母菌呼吸作用速度越快**

16. 对比预测（用户分析完后，用"---"分隔）：
    "很好！
    ---
    你之前预测的是「XXX」（用用户在步骤12选择的具体内容替换XXX）。现在你的想法改变了吗？"
    
    **重要**：必须引用用户之前选择的预测内容
    **注意**：不要直接说出结论，让用户自己表达
    
    根据用户预测给予反馈：
    - 如果用户预测正确（温度越高产生气体越多）且实验验证了：肯定学生的预测，说明通过实验证实了预测
    - 如果用户预测错误：强调科学探究的意义——通过实验来验证或修正我们的想法

17. 陈述结论（用户回答后，用"---"分隔）：
    根据用户的回答给予具体反馈，然后：
    "---
    现在，请用科学的语言总结一下我们的实验结论吧。"
    
    引导用户用科学语言陈述结论

### Part 4 总结反思
18. 流程回顾（用户总结完后，用"---"分隔）：
    "通过实验，我们得到了结论：温度越高，酵母菌相同时间产生的气体越多，呼吸作用速度越快！
    ---
    恭喜你完成了这次科学探究！让我们回顾一下探究过程：
    <<<{"action": "showFlowChart"}>>>
    
    **⚠️ 重要：总结要写成一段连贯的话，不要散点式**
    根据用户实际操作，生成一段连贯的个性化总结，例如：
    "在这次探究中，我们从发面现象出发，提出了'温度是否影响酵母菌呼吸作用速度'的问题。你预测了XXX，然后设置了10°C、20°C、30°C、40°C、50°C五组不同温度进行实验。实验结果显示，温度越高产生的气体越多，最终你得出了'在一定范围内，温度越高酵母菌呼吸作用速度越快'的结论。""

19. 元认知问题（用"---"分隔）：
    "这就是完整的科学探究流程！
    ---
    （根据用户在本次探究中的表现，生成一个个性化的元认知问题）"
    
    **重要**：根据用户的真实探究过程动态生成问题，例如：
    - 如果用户在控制变量部分答错过：可以问"刚才你在选择控制变量时犯了一个小错误，现在回想一下，为什么温度不能作为控制变量？"
    - 如果用户预测与结果不符：可以问"你之前预测的结果和实验结果不太一样，这个差异让你学到了什么？"
    - 如果用户表现很好：可以问"如果让你设计一个研究其他因素（比如糖的量）对酵母菌呼吸的影响的实验，你会怎么设计？"
    - 也可以问"在这次探究中，哪个环节让你印象最深刻？为什么？"
    
    **禁止**：不要使用固定的问题模板，要结合用户的实际表现

20. 课程结束：根据用户回答给予肯定，祝贺完成探究

## 重要规则
1. **每条消息只讲一件事**：严格禁止在一条消息里混合多个步骤！
   - 如果需要在一次回复中包含多个步骤，使用"---"分隔符将它们分开
   - 系统会自动将"---"分隔的内容拆分成多条消息显示
   - 例如："聚焦问题内容...\n---\n介绍材料内容..."会显示为两条独立消息
2. **每条消息必须以问题或明确的行动指引结尾**：不能只输出陈述句让用户不知所措。
   - ❌ 错误示例："很好！酵母菌呼吸作用会产生二氧化碳。"（只是陈述，用户不知道下一步）
   - ✅ 正确示例："很好！酵母菌呼吸作用会产生二氧化碳。那你觉得温度会影响这个过程吗？"（以问题结尾）
   - ✅ 正确示例："材料已准备好，你准备好开始了吗？"（以行动指引结尾）
3. 严格按照流程执行，不要跳步
4. 选择题/多选题用户确认后会自动发送结果，直接给反馈
5. 使用系统提供的真实数据，不要编造数据
6. 回复简洁，每次不超过80字（指令除外）
7. 对比预测时不要替用户说出结论
8. 总结时必须显示流程图
9. **控制变量多选题如果用户选错，解释错因后必须再次使用showMultiChoice指令让用户重新选择，直到选对为止**`;

// AI对话管理类
export class AIChatManager {
  constructor() {
    this.messagesContainer = document.getElementById('chatMessages');
    this.chatInput = document.getElementById('chatInput');
    this.btnSend = document.getElementById('btnSend');
    
    this.messages = []; // 对话历史
    this.userPrediction = null; // 保存用户的预测
    this.currentChoiceCallback = null; // 当前选择题的回调
    
    // 事件回调
    this.onCommand = null; // 处理AI发出的指令
    this.onUserMessage = null; // 用户发送消息时
    
    this.bindEvents();
  }

  // 绑定事件
  bindEvents() {
    this.btnSend.addEventListener('click', () => this.sendUserMessage());
    this.chatInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        this.sendUserMessage();
      }
    });
  }

  // 启用输入
  enableInput(enable) {
    this.chatInput.disabled = !enable;
    this.btnSend.disabled = !enable;
  }

  // 添加AI消息
  addAIMessage(content, withImage = null) {
    // 检测是否需要拆分消息（通过 --- 分隔符）
    const parts = content.split(/\n---\n|\n-{3,}\n/);
    
    if (parts.length > 1) {
      // 有多个部分，逐个显示（传入 skipHistory=true 避免重复添加历史）
      parts.forEach((part, index) => {
        const trimmedPart = part.trim();
        if (trimmedPart) {
          setTimeout(() => {
            this._addSingleMessage(trimmedPart, index === 0 ? withImage : null, true);
          }, index * 800); // 每条消息间隔800ms
        }
      });
      // 只添加一次完整内容到历史
      this.messages.push({ role: 'assistant', content: content });
      return null;
    }
    
    return this._addSingleMessage(content, withImage, false);
  }
  
  // 添加单条AI消息
  // skipHistory: 拆分模式下为true，避免重复添加到历史
  _addSingleMessage(content, withImage = null, skipHistory = false) {
    const msgDiv = document.createElement('div');
    msgDiv.className = 'chat-message ai';
    
    // 解析并提取指令
    const { text, commands } = this.parseCommands(content);
    
    msgDiv.innerHTML = text;
    
    if (withImage) {
      const img = document.createElement('img');
      img.src = withImage;
      img.alt = '场景图片';
      msgDiv.appendChild(img);
    }
    
    this.messagesContainer.appendChild(msgDiv);
    this.scrollToBottom();
    
    // 添加到历史（拆分模式下跳过，由 addAIMessage 统一添加）
    if (!skipHistory) {
      this.messages.push({ role: 'assistant', content: content });
    }
    
    // 执行指令
    commands.forEach(cmd => {
      if (this.onCommand) {
        this.onCommand(cmd);
      }
    });
    
    return msgDiv;
  }

  // 添加用户消息
  addUserMessage(content) {
    const msgDiv = document.createElement('div');
    msgDiv.className = 'chat-message user';
    msgDiv.textContent = content;
    
    this.messagesContainer.appendChild(msgDiv);
    this.scrollToBottom();
    
    // 添加到历史
    this.messages.push({ role: 'user', content: content });
  }

  // 解析指令
  parseCommands(content) {
    const commands = [];
    const text = content.replace(/<<<(.+?)>>>/gs, (match, json) => {
      try {
        const cmd = JSON.parse(json);
        commands.push(cmd);
      } catch (e) {
        console.error('Failed to parse command:', json);
      }
      return ''; // 从显示文本中移除指令
    });
    
    return { text: text.trim(), commands };
  }

  // 显示选择题
  showChoiceQuestion(question, options, callback, autoNext = false) {
    const msgDiv = document.createElement('div');
    msgDiv.className = 'chat-message ai';
    
    const choiceDiv = document.createElement('div');
    choiceDiv.className = 'choice-question';
    choiceDiv.innerHTML = `
      <p>${question}</p>
      <div class="choice-options">
        ${options.map((opt, i) => `
          <div class="choice-option" data-index="${i}">${String.fromCharCode(65 + i)}. ${opt}</div>
        `).join('')}
      </div>
    `;
    
    msgDiv.appendChild(choiceDiv);
    this.messagesContainer.appendChild(msgDiv);
    this.scrollToBottom();

    // 绑定选择事件
    const optionElements = choiceDiv.querySelectorAll('.choice-option');
    optionElements.forEach(opt => {
      opt.addEventListener('click', async () => {
        // 防止重复点击
        if (opt.classList.contains('selected')) return;
        
        // 取消其他选中，禁用所有选项
        optionElements.forEach(o => {
          o.classList.remove('selected');
          o.style.pointerEvents = 'none';
        });
        opt.classList.add('selected');
        
        const selectedIndex = parseInt(opt.dataset.index);
        const selectedText = options[selectedIndex];
        
        if (callback) {
          callback(selectedIndex, selectedText);
        }
        
        // 如果autoNext为true，自动获取AI回复
        if (autoNext) {
          // 直接添加到消息历史（不显示用户消息气泡，因为选择题已经显示了选中状态）
          this.messages.push({ role: 'user', content: `我选择了: ${selectedText}` });
          
          // 获取AI回复
          this.enableInput(false);
          this.showTypingIndicator();
          
          try {
            const response = await fetch(config.api.baseUrl, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${config.api.apiKey}`,
              },
              body: JSON.stringify({
                model: config.api.model,
                messages: [
                  { role: 'system', content: SYSTEM_PROMPT },
                  ...this.messages,
                ],
                temperature: 0.7,
                max_tokens: 1000,
              }),
            });

            if (!response.ok) {
              throw new Error(`API error: ${response.status}`);
            }

            const data = await response.json();
            const aiMessage = data.choices[0].message.content;
            
            this.hideTypingIndicator();
            this.addAIMessage(aiMessage);
            
          } catch (error) {
            console.error('AI API Error:', error);
            this.hideTypingIndicator();
            this.addAIMessage('抱歉，我遇到了一些问题。请稍后再试。');
          }
          
          this.enableInput(true);
        }
      });
    });
  }

  // 显示多选题
  showMultiChoiceQuestion(question, options, correctAnswers, callback, autoNext = false) {
    const msgDiv = document.createElement('div');
    msgDiv.className = 'chat-message ai';
    
    const choiceDiv = document.createElement('div');
    choiceDiv.className = 'choice-question multi-choice';
    choiceDiv.innerHTML = `
      <p>${question}<br><small style="color: #94a3b8;">（可多选，选完后点击"确认"）</small></p>
      <div class="choice-options">
        ${options.map((opt, i) => `
          <div class="choice-option multi" data-index="${i}">${String.fromCharCode(65 + i)}. ${opt}</div>
        `).join('')}
      </div>
      <button class="btn btn-confirm-choice" style="margin-top: 12px; background: var(--primary-color); color: white; padding: 8px 20px; border: none; border-radius: 6px; cursor: pointer;">确认选择</button>
    `;
    
    msgDiv.appendChild(choiceDiv);
    this.messagesContainer.appendChild(msgDiv);
    this.scrollToBottom();

    const selectedIndices = new Set();
    const optionElements = choiceDiv.querySelectorAll('.choice-option');
    const confirmBtn = choiceDiv.querySelector('.btn-confirm-choice');
    
    // 多选切换
    optionElements.forEach(opt => {
      opt.addEventListener('click', () => {
        const index = parseInt(opt.dataset.index);
        if (selectedIndices.has(index)) {
          selectedIndices.delete(index);
          opt.classList.remove('selected');
        } else {
          selectedIndices.add(index);
          opt.classList.add('selected');
        }
      });
    });
    
    // 确认按钮
    confirmBtn.addEventListener('click', async () => {
      if (selectedIndices.size === 0) {
        alert('请至少选择一个选项');
        return;
      }
      
      // 禁用所有选项和按钮
      optionElements.forEach(o => o.style.pointerEvents = 'none');
      confirmBtn.disabled = true;
      confirmBtn.textContent = '已确认';
      
      const selectedArray = Array.from(selectedIndices).sort();
      const selectedTexts = selectedArray.map(i => options[i]);
      
      // 检查是否选了"温度"（index 3）
      const selectedTemperature = selectedIndices.has(3);
      // 检查是否选对了（0,1,2都选了，3没选）
      const isCorrect = selectedArray.length === 3 && 
                        selectedIndices.has(0) && 
                        selectedIndices.has(1) && 
                        selectedIndices.has(2) && 
                        !selectedIndices.has(3);
      
      if (callback) {
        callback(selectedArray, selectedTexts);
      }
      
      if (autoNext) {
        // 构建消息
        let userMsg = `我选择了: ${selectedTexts.join('、')}`;
        if (selectedTemperature) {
          userMsg += ' [用户选择了"温度"，需要解释为什么温度不能控制]';
        } else if (!isCorrect) {
          userMsg += ' [用户选择不完整，正确答案应该是酵母菌数量、白砂糖质量、水量]';
        } else {
          userMsg += ' [回答正确]';
        }
        
        this.messages.push({ role: 'user', content: userMsg });
        
        // 获取AI回复
        this.enableInput(false);
        this.showTypingIndicator();
        
        try {
          const response = await fetch(config.api.baseUrl, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${config.api.apiKey}`,
            },
            body: JSON.stringify({
              model: config.api.model,
              messages: [
                { role: 'system', content: SYSTEM_PROMPT },
                ...this.messages,
              ],
              temperature: 0.7,
              max_tokens: 1000,
            }),
          });

          if (!response.ok) {
            throw new Error(`API error: ${response.status}`);
          }

          const data = await response.json();
          const aiMessage = data.choices[0].message.content;
          
          this.hideTypingIndicator();
          this.addAIMessage(aiMessage);
          
        } catch (error) {
          console.error('AI API Error:', error);
          this.hideTypingIndicator();
          this.addAIMessage('抱歉，我遇到了一些问题。请稍后再试。');
        }
        
        this.enableInput(true);
      }
    });
  }

  // 显示打字指示器
  showTypingIndicator() {
    const indicator = document.createElement('div');
    indicator.className = 'chat-message ai typing-indicator';
    indicator.id = 'typingIndicator';
    indicator.innerHTML = '<span></span><span></span><span></span>';
    this.messagesContainer.appendChild(indicator);
    this.scrollToBottom();
  }

  // 隐藏打字指示器
  hideTypingIndicator() {
    const indicator = document.getElementById('typingIndicator');
    if (indicator) {
      indicator.remove();
    }
  }

  // 发送用户消息
  async sendUserMessage() {
    const content = this.chatInput.value.trim();
    if (!content) return;
    
    this.addUserMessage(content);
    this.chatInput.value = '';
    
    // 调用外部处理器，检查是否需要拦截
    if (this.onUserMessage) {
      const result = this.onUserMessage(content);
      // 如果返回了拦截信息，显示提示并阻止发送给AI
      if (result && result.block) {
        this.addAIMessage(result.message);
        return;
      }
    }
    
    // 获取AI回复
    await this.getAIResponse(content);
  }

  // 获取AI回复
  async getAIResponse(userMessage) {
    this.enableInput(false);
    this.showTypingIndicator();
    
    try {
      const response = await fetch(config.api.baseUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${config.api.apiKey}`,
        },
        body: JSON.stringify({
          model: config.api.model,
          messages: [
            { role: 'system', content: SYSTEM_PROMPT },
            ...this.messages,
          ],
          temperature: 0.7,
          max_tokens: 1000,
        }),
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const data = await response.json();
      const aiMessage = data.choices[0].message.content;
      
      this.hideTypingIndicator();
      this.addAIMessage(aiMessage);
      
    } catch (error) {
      console.error('AI API Error:', error);
      this.hideTypingIndicator();
      this.addAIMessage('抱歉，我遇到了一些问题。请稍后再试。');
    }
    
    this.enableInput(true);
    this.chatInput.focus();
  }

  // 开始对话（Part 1 场景a：发面时加入酵母菌）
  async startConversation() {
    this.enableInput(false);
    this.showTypingIndicator();
    
    // 场景a：只描述发面时加入酵母菌，提问"为什么要加酵母菌"
    const initialMessage = `你好！我是你的AI探究导师 🔬

今天我们要一起探索一个有趣的科学问题！

想象一下：妈妈要做馒头，发面时加入了酵母菌，揉成面团后放在一边，过了一会儿面团就变大了...

<<<{"action": "showSceneImage"}>>>

你知道发面为什么要加酵母菌吗？`;

    // 模拟AI思考时间
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    this.hideTypingIndicator();
    this.addAIMessage(initialMessage);
    this.enableInput(true);
  }

  // 滚动到底部
  scrollToBottom() {
    this.messagesContainer.scrollTop = this.messagesContainer.scrollHeight;
  }

  // 获取对话历史
  getMessages() {
    return this.messages;
  }

  // 保存用户预测
  saveUserPrediction(prediction) {
    this.userPrediction = prediction;
  }

  // 获取用户预测
  getUserPrediction() {
    return this.userPrediction;
  }
}
