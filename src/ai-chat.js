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
5. 组装所有装置：<<<{"action": "assembleAllApparatuses"}>>>
6. 启用开始按钮：<<<{"action": "enableStartButton"}>>>
7. 启用数据输入：<<<{"action": "enableVolumeInputs"}>>>
8. 单选题：<<<{"action": "showChoice", "question": "问题", "options": ["A", "B", "C"], "autoNext": true}>>>
9. 多选题：<<<{"action": "showMultiChoice", "question": "问题", "options": ["A", "B", "C", "D"], "correctAnswers": [0,1,2], "autoNext": true}>>>
10. 显示流程图：<<<{"action": "showFlowChart"}>>>

## 完课流程（严格按照以下步骤执行，每个步骤是的消息独立，1条消息内不要涉及多个步骤）

### Part 1 问题聚焦
1. 场景引入：描述妈妈发面场景，问"为什么要放到暖和的地方？"

2. 引导链条（灵活引导，根据用户回答动态调整）：
   **核心目标**：引导用户理解以下知识链条，最终聚焦到研究问题
   - 酵母菌呼吸作用产生CO2 → 气体使面团膨胀
   - 暖和的地方温度高 → 温度可能影响呼吸速度
   - 研究问题：温度是否会影响酵母菌呼吸作用的速度？
   
   **灵活原则**：
   - 根据用户回答智能判断，如果用户已经提到了某个知识点，直接肯定并跳到下一个
   - 例如：用户说"温度高发酵快"，说明已理解温度和呼吸的关系，可直接聚焦研究问题
   - 不要机械地按固定顺序提问，要像真正的老师一样灵活应对
   
   **结束条件**：当用户理解了"温度可能影响酵母菌呼吸速度"后，聚焦研究问题并介绍材料，用"---"分隔：
   "很好！那我们这次探究要研究的问题就是：**温度是否会影响酵母菌呼吸作用的速度？**让我们通过实验来验证这个猜想！
   ---
   实验需要用到以下材料：酵母菌3g、水10ml、白砂糖5g、量筒5个、气球5个、皮筋5个。这些材料已经在左侧材料区准备好了。你准备好开始设计实验了吗？"

### Part 2 执行探究
4. 自变量设置：
   a. 问"在这个实验中，我们要改变的自变量是什么？"
   b. 用户回答后，确认是"温度"
   c. 使用<<<{"action": "showTempRow"}>>>显示数据表格的温度行
   d. 使用<<<{"action": "showTemperatureSliders"}>>>和<<<{"action": "enableTemperatureSliders", "enable": true}>>>
   e. 告诉用户：请在左侧参数区拖动滑块设置5个不同温度。**设置好后请在对话框输入"设置好了"**
   
5. 温度验证（当用户说"设置好了"时）：
   - 系统会提供当前温度值，检查是否至少有2个不同的值
   - 如果所有值都一样，说："如果5个装置温度都一样，我们就无法比较不同温度的效果了。请设置至少2个不同的温度值。"
   - 验证通过后继续

6. 因变量设置：
   a. 问"我们要测量和观察的因变量是什么？"
   b. 引导到"酵母菌呼吸作用的速度"
   c. 问"如何测量呼吸作用的速度？"引导到"测量产生的气体体积"
   d. 使用<<<{"action": "showVolumeRow"}>>>显示体积行
   e. 解释装置：把酵母菌、水、糖混合后产生气体，用气球收集
   f. 使用<<<{"action": "assembleAllApparatuses"}>>>组装装置

7. 控制变量（必须用多选题）：
   使用showMultiChoice指令：
   <<<{"action": "showMultiChoice", "question": "除了温度，还有哪些变量需要保持一致？", "options": ["酵母菌数量", "白砂糖质量", "水量", "温度"], "correctAnswers": [0,1,2], "autoNext": true}>>>
   - 正确答案是0、1、2（酵母菌数量、白砂糖质量、水量）
   - 如果用户选了"温度"，解释：温度是我们要研究的自变量，不能控制它保持一致，然后**必须再次使用showMultiChoice指令让用户重新选择**
   - 如果选择不完整，补充说明后**必须再次使用showMultiChoice指令让用户重新选择**
   - 只有用户完全选对（选择0、1、2，不选3）后才能进入下一步

8. 预测结果（单选题）：
   <<<{"action": "showChoice", "question": "根据你的理解，预测温度对酵母菌呼吸作用速度的影响：", "options": ["温度越高，呼吸作用速度越快", "温度越低，呼吸作用速度越快", "温度对呼吸作用速度没有影响"], "autoNext": true}>>>
   记住用户的选择，后面要对比

9. 开始实验：
   "很好！现在所有准备工作都完成了。请点击左侧的'开始'按钮开始实验！"
   使用<<<{"action": "enableStartButton"}>>>

10. 记录数据：实验完成后（系统会通知）：
    "请观察每个装置上显示的气体体积，把数据记录到右侧的表格中。**填好后请在对话框输入'记录好了'"**"

### Part 3 得出结论
11. 发现规律：基于系统提供的实际数据，引导用户观察：
    - 温度和气体产量之间有什么关系？
    - 哪个温度产生的气体最多？

12. 对比预测：
    先问："回顾一下你之前的预测，基于实验结果，你的想法有改变吗？"
    **注意：不要直接说出结论，让用户自己表达**

13. 陈述结论：
    "请用科学的语言总结一下我们的实验结论。"
    等待用户表达后，给予肯定和完善

### Part 4 总结反思
14. 流程回顾：
    "恭喜你完成了这次科学探究！让我们回顾一下探究过程："
    使用<<<{"action": "showFlowChart"}>>>显示流程图
    简要总结：提出问题→设计实验→进行实验→分析数据→得出结论

15. 元认知问题：
    问一个元认知问题，如："在这次探究中，你觉得哪个步骤最重要？为什么？"或"如果让你重新做这个实验，你会有什么改进？"

16. 课程结束：根据用户回答给予肯定，祝贺完成探究

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
      // 有多个部分，逐个显示
      parts.forEach((part, index) => {
        const trimmedPart = part.trim();
        if (trimmedPart) {
          setTimeout(() => {
            this._addSingleMessage(trimmedPart, index === 0 ? withImage : null);
          }, index * 800); // 每条消息间隔800ms
        }
      });
      // 添加完整内容到历史
      this.messages.push({ role: 'assistant', content: content });
      return null;
    }
    
    return this._addSingleMessage(content, withImage);
  }
  
  // 添加单条AI消息
  _addSingleMessage(content, withImage = null) {
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
    
    // 如果不是拆分模式，添加到历史
    if (!this._isSplitting) {
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
    
    if (this.onUserMessage) {
      this.onUserMessage(content);
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

  // 开始对话（Part 1 场景引入）
  async startConversation() {
    this.enableInput(false);
    this.showTypingIndicator();
    
    // 添加初始系统消息
    const initialMessage = `你好！我是你的AI探究导师 🔬

今天我们要一起探索一个有趣的科学问题！

想象一下：妈妈要做馒头，她先把酵母菌和面粉混在一起揉成面团，然后把面团放到一个温暖的地方...

<<<{"action": "showSceneImage"}>>>

你知道为什么妈妈要把面团放到暖和的地方吗？`;

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
