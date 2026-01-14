// 实验模拟器模块 - 核心实验逻辑

import { config, calculateGasVolume } from './config.js';

// 实验状态枚举
export const ExperimentStatus = {
  IDLE: 'idle',           // 未开始
  RUNNING: 'running',     // 运行中
  PAUSED: 'paused',       // 暂停
  COMPLETED: 'completed', // 已完成
};

// 实验装置类
class Apparatus {
  constructor(index) {
    this.index = index;
    this.temperature = config.experiment.temperatureDefault;
    this.hasWater = false;
    this.hasSugar = false;
    this.hasYeast = false;
    this.hasBalloon = false;
    this.hasRubberBand = false;
    this.gasVolume = 0;
    this.element = null;
  }

  // 检查装置是否组装完成
  isAssembled() {
    return this.hasWater && this.hasSugar && this.hasYeast && this.hasBalloon && this.hasRubberBand;
  }

  // 更新气体体积
  updateGasVolume(hours) {
    if (this.isAssembled()) {
      this.gasVolume = calculateGasVolume(this.temperature, hours);
    }
    return this.gasVolume;
  }

  // 获取格式化的气体体积
  getFormattedVolume() {
    return this.gasVolume.toFixed(config.ui.decimalPlaces);
  }
}

// 实验模拟器类
export class Simulator {
  constructor() {
    // DOM元素
    this.benchContent = document.getElementById('benchContent');
    this.parametersContainer = document.getElementById('parametersContainer');
    this.timerValue = document.getElementById('timerValue');
    this.btnStart = document.getElementById('btnStart');
    this.btnPause = document.getElementById('btnPause');
    this.btnReset = document.getElementById('btnReset');

    // 实验状态
    this.status = ExperimentStatus.IDLE;
    this.apparatuses = [];
    this.currentHours = 0;
    this.timerInterval = null;
    this.temperatureSlidersEnabled = false;

    // 事件回调
    this.onTemperatureChange = null;
    this.onExperimentStart = null;
    this.onExperimentTick = null;
    this.onExperimentComplete = null;
    this.onControlButtonClick = null;

    // 初始化装置
    for (let i = 0; i < config.ui.apparatusCount; i++) {
      this.apparatuses.push(new Apparatus(i));
    }

    // 绑定按钮事件
    this.bindEvents();
  }

  // 绑定按钮事件
  bindEvents() {
    this.btnStart.addEventListener('click', () => {
      if (this.status === ExperimentStatus.IDLE || this.status === ExperimentStatus.PAUSED) {
        this.startExperiment();
        if (this.onControlButtonClick) this.onControlButtonClick('start');
      }
    });

    this.btnPause.addEventListener('click', () => {
      if (this.status === ExperimentStatus.RUNNING) {
        this.pauseExperiment();
        if (this.onControlButtonClick) this.onControlButtonClick('pause');
      }
    });

    this.btnReset.addEventListener('click', () => {
      this.resetExperiment();
      if (this.onControlButtonClick) this.onControlButtonClick('reset');
    });
  }

  // ==================== 公开API ====================

  // 显示温度滑块
  showTemperatureSliders() {
    this.parametersContainer.innerHTML = '';
    
    for (let i = 0; i < config.ui.apparatusCount; i++) {
      const group = document.createElement('div');
      group.className = 'temp-slider-group';
      group.innerHTML = `
        <span class="temp-slider-label">温度${i + 1}</span>
        <input type="range" class="temp-slider" id="tempSlider-${i}"
          min="${config.experiment.temperatureMin}"
          max="${config.experiment.temperatureMax}"
          value="${config.experiment.temperatureDefault}"
          ${this.temperatureSlidersEnabled ? '' : 'disabled'}>
        <span class="temp-value" id="tempValue-${i}">${config.experiment.temperatureDefault}°C</span>
      `;
      this.parametersContainer.appendChild(group);

      // 绑定滑块事件
      const slider = group.querySelector('.temp-slider');
      const valueDisplay = group.querySelector('.temp-value');
      
      slider.addEventListener('input', (e) => {
        const temp = parseInt(e.target.value);
        this.apparatuses[i].temperature = temp;
        valueDisplay.textContent = `${temp}°C`;
        
        // 更新数据表格
        this.updateDataTableTemperature(i, temp);
        
        // 触发回调
        if (this.onTemperatureChange) {
          this.onTemperatureChange(this.getTemperatures());
        }
      });
    }
  }

  // 启用/禁用温度滑块
  enableTemperatureSliders(enable) {
    this.temperatureSlidersEnabled = enable;
    const sliders = this.parametersContainer.querySelectorAll('.temp-slider');
    sliders.forEach(slider => {
      slider.disabled = !enable;
    });
  }

  // 设置温度值
  setTemperatures(temps) {
    temps.forEach((temp, i) => {
      if (i < this.apparatuses.length) {
        this.apparatuses[i].temperature = temp;
        
        // 更新滑块UI
        const slider = document.getElementById(`tempSlider-${i}`);
        const valueDisplay = document.getElementById(`tempValue-${i}`);
        if (slider && valueDisplay) {
          slider.value = temp;
          valueDisplay.textContent = `${temp}°C`;
        }
        
        // 更新数据表格
        this.updateDataTableTemperature(i, temp);
      }
    });
  }

  // 获取温度值
  getTemperatures() {
    return this.apparatuses.map(a => a.temperature);
  }

  // 组装装置
  assembleApparatus(index, components = { water: true, sugar: true, yeast: true, balloon: true, rubberBand: true }) {
    const apparatus = this.apparatuses[index];
    if (!apparatus) return;

    if (components.water) apparatus.hasWater = true;
    if (components.sugar) apparatus.hasSugar = true;
    if (components.yeast) apparatus.hasYeast = true;
    if (components.balloon) apparatus.hasBalloon = true;
    if (components.rubberBand) apparatus.hasRubberBand = true;

    this.renderApparatuses();
  }

  // 显示所有装置
  showAllApparatuses() {
    this.benchContent.innerHTML = '';
    this.renderApparatuses();
  }

  // 渲染装置
  renderApparatuses() {
    this.benchContent.innerHTML = '';
    
    this.apparatuses.forEach((apparatus, i) => {
      if (!apparatus.isAssembled()) return;
      
      const div = document.createElement('div');
      div.className = 'apparatus';
      div.id = `apparatus-${i}`;
      
      // 计算气球大小（基于气体体积）
      const balloonScale = 1 + (apparatus.gasVolume / 100);
      
      div.innerHTML = `
        <div class="apparatus-balloon" style="transform: scale(${balloonScale})"></div>
        <div class="apparatus-cylinder">
          <div class="cylinder-liquid"></div>
          <div class="cylinder-bubbles" id="bubbles-${i}"></div>
        </div>
        <div class="apparatus-volume">${apparatus.getFormattedVolume()} ml</div>
        <div class="apparatus-temp">${apparatus.temperature}°C</div>
      `;
      
      apparatus.element = div;
      this.benchContent.appendChild(div);
    });

    if (this.benchContent.children.length === 0) {
      this.benchContent.innerHTML = '<div class="empty-hint">实验台为空，请按照AI指引开始实验</div>';
    }
  }

  // 更新数据表格的温度
  updateDataTableTemperature(index, temp) {
    const cell = document.getElementById(`temp-${index + 1}`);
    if (cell) {
      cell.textContent = `${temp}`;
    }
  }

  // 更新数据表格（体积输入启用）
  enableVolumeInputs(enable) {
    for (let i = 1; i <= config.ui.apparatusCount; i++) {
      const input = document.getElementById(`volume-${i}`);
      if (input) {
        input.disabled = !enable;
      }
    }
  }

  // 高亮数据单元格
  highlightDataCell(row, col) {
    const input = document.getElementById(`volume-${col}`);
    if (input) {
      input.focus();
      input.style.borderColor = '#f59e0b';
    }
  }

  // 获取气体体积
  getGasVolumes() {
    return this.apparatuses.map(a => parseFloat(a.getFormattedVolume()));
  }

  // 获取实验状态
  getExperimentStatus() {
    return this.status;
  }

  // 启用控制按钮
  enableControlButtons(buttons = { start: false, pause: false, reset: false }) {
    this.btnStart.disabled = !buttons.start;
    this.btnPause.disabled = !buttons.pause;
    this.btnReset.disabled = !buttons.reset;
  }

  // 开始实验
  startExperiment() {
    if (this.status === ExperimentStatus.RUNNING) return;
    
    this.status = ExperimentStatus.RUNNING;
    this.enableControlButtons({ start: false, pause: true, reset: true });
    
    if (this.onExperimentStart) {
      this.onExperimentStart();
    }

    // 启动计时器
    const tickInterval = config.experiment.realSecondsPerHour * 1000;
    
    this.timerInterval = setInterval(() => {
      this.currentHours++;
      this.timerValue.textContent = `${this.currentHours}小时`;
      
      // 更新所有装置的气体体积
      this.apparatuses.forEach(apparatus => {
        apparatus.updateGasVolume(this.currentHours);
      });
      
      // 重新渲染
      this.renderApparatuses();
      
      // 添加气泡动画
      this.addBubbles();
      
      // 触发tick回调
      if (this.onExperimentTick) {
        this.onExperimentTick(this.currentHours, this.getGasVolumes());
      }
      
      // 检查是否完成
      if (this.currentHours >= config.experiment.totalHours) {
        this.completeExperiment();
      }
    }, tickInterval);
  }

  // 暂停实验
  pauseExperiment() {
    if (this.status !== ExperimentStatus.RUNNING) return;
    
    this.status = ExperimentStatus.PAUSED;
    clearInterval(this.timerInterval);
    this.enableControlButtons({ start: true, pause: false, reset: true });
  }

  // 完成实验
  completeExperiment() {
    this.status = ExperimentStatus.COMPLETED;
    clearInterval(this.timerInterval);
    this.enableControlButtons({ start: false, pause: false, reset: true });
    
    if (this.onExperimentComplete) {
      this.onExperimentComplete(this.getGasVolumes());
    }
  }

  // 重置实验
  resetExperiment() {
    this.status = ExperimentStatus.IDLE;
    this.currentHours = 0;
    clearInterval(this.timerInterval);
    
    this.timerValue.textContent = '0小时';
    this.enableControlButtons({ start: false, pause: false, reset: false });
    
    // 重置装置
    this.apparatuses.forEach(apparatus => {
      apparatus.gasVolume = 0;
      apparatus.hasWater = false;
      apparatus.hasSugar = false;
      apparatus.hasYeast = false;
      apparatus.hasBalloon = false;
      apparatus.hasRubberBand = false;
    });
    
    // 清空实验台
    this.benchContent.innerHTML = '<div class="empty-hint">实验台为空，请按照AI指引开始实验</div>';
    
    // 清空数据表格
    for (let i = 1; i <= config.ui.apparatusCount; i++) {
      document.getElementById(`temp-${i}`).textContent = '-';
      const input = document.getElementById(`volume-${i}`);
      input.value = '';
      input.disabled = true;
      input.className = 'volume-input';
    }
  }

  // 添加气泡动画
  addBubbles() {
    this.apparatuses.forEach((apparatus, i) => {
      if (!apparatus.isAssembled() || apparatus.gasVolume === 0) return;
      
      const bubblesContainer = document.getElementById(`bubbles-${i}`);
      if (!bubblesContainer) return;
      
      // 添加几个气泡
      const bubbleCount = Math.min(3, Math.ceil(apparatus.gasVolume / 20));
      for (let j = 0; j < bubbleCount; j++) {
        const bubble = document.createElement('div');
        bubble.className = 'bubble';
        bubble.style.left = `${10 + Math.random() * 30}px`;
        bubble.style.bottom = '10px';
        bubble.style.width = `${4 + Math.random() * 4}px`;
        bubble.style.height = bubble.style.width;
        bubble.style.animationDelay = `${Math.random() * 0.5}s`;
        bubblesContainer.appendChild(bubble);
        
        // 动画结束后移除
        setTimeout(() => bubble.remove(), 2000);
      }
    });
  }

  // 验证用户输入的体积值
  validateVolumeInput(index, userValue) {
    const correctValue = this.getGasVolumes()[index];
    const userNum = parseFloat(userValue);
    
    const input = document.getElementById(`volume-${index + 1}`);
    
    if (isNaN(userNum)) {
      return { valid: false, correct: correctValue, message: '请输入有效的数字' };
    }
    
    // 精确匹配（保留2位小数）
    if (userNum.toFixed(2) === correctValue.toFixed(2)) {
      input.classList.remove('incorrect');
      input.classList.add('correct');
      return { valid: true, correct: correctValue };
    } else {
      input.classList.remove('correct');
      input.classList.add('incorrect');
      return { valid: false, correct: correctValue, message: `你填写的是${userValue}ml，再仔细看看装置${index + 1}上显示的数值哦` };
    }
  }
}
