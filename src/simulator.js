// 实验模拟器模块 - 核心实验逻辑

import { config, calculateGasVolume } from './config.js';

// 实验状态枚举
export const ExperimentStatus = {
  IDLE: 'idle',           // 未开始
  RUNNING: 'running',     // 运行中
  PAUSED: 'paused',       // 暂停
  COMPLETED: 'completed', // 已完成
};

// 组装步骤顺序
export const ASSEMBLY_STEPS = [
  { material: 'cylinder', name: '量筒', description: '拖动量筒到实验台' },
  { material: 'water', name: '水', description: '往量筒中添加10ml水' },
  { material: 'yeast', name: '酵母菌', description: '加入3g酵母菌' },
  { material: 'sugar', name: '白砂糖', description: '加入5g白砂糖' },
  { material: 'stirringRod', name: '搅拌棒', description: '用搅拌棒搅拌均匀' },
  { material: 'balloon', name: '气球', description: '在量筒上套上气球' },
  { material: 'rubberBand', name: '皮筋', description: '用皮筋系紧' },
];

// 实验装置类
class Apparatus {
  constructor(index) {
    this.index = index;
    this.temperature = config.experiment.temperatureDefault;
    this.hasCylinder = false;  // 新增：是否有量筒
    this.hasWater = false;
    this.hasSugar = false;
    this.hasYeast = false;
    this.hasStirred = false;   // 新增：是否已搅拌
    this.hasBalloon = false;
    this.hasRubberBand = false;
    this.gasVolume = 0;
    this.element = null;
  }

  // 检查装置是否组装完成
  isAssembled() {
    return this.hasCylinder && this.hasWater && this.hasSugar && this.hasYeast && 
           this.hasStirred && this.hasBalloon && this.hasRubberBand;
  }
  
  // 检查装置是否部分组装（至少有量筒）
  isPartiallyAssembled() {
    return this.hasCylinder;
  }
  
  // 获取当前组装进度（0-7）
  getAssemblyProgress() {
    let progress = 0;
    if (this.hasCylinder) progress++;
    if (this.hasWater) progress++;
    if (this.hasYeast) progress++;
    if (this.hasSugar) progress++;
    if (this.hasStirred) progress++;
    if (this.hasBalloon) progress++;
    if (this.hasRubberBand) progress++;
    return progress;
  }
  
  // 添加材料
  addMaterial(materialId) {
    switch (materialId) {
      case 'cylinder': this.hasCylinder = true; break;
      case 'water': this.hasWater = true; break;
      case 'yeast': this.hasYeast = true; break;
      case 'sugar': this.hasSugar = true; break;
      case 'stirringRod': this.hasStirred = true; break;
      case 'balloon': this.hasBalloon = true; break;
      case 'rubberBand': this.hasRubberBand = true; break;
    }
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
    
    // 组装状态
    this.assemblyMode = false;           // 是否处于组装模式
    this.currentAssemblyIndex = 0;       // 当前正在组装的装置索引
    this.currentAssemblyStep = 0;        // 当前组装步骤
    this.expectedMaterial = null;        // 期望的下一个材料

    // 事件回调
    this.onTemperatureChange = null;
    this.onExperimentStart = null;
    this.onExperimentTick = null;
    this.onExperimentComplete = null;
    this.onControlButtonClick = null;
    this.onMaterialDropped = null;       // 材料放置回调

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

  // ==================== 组装相关API ====================
  
  // 启用组装模式
  startAssemblyMode() {
    this.assemblyMode = true;
    this.currentAssemblyIndex = 0;
    this.currentAssemblyStep = 0;
    this.expectedMaterial = ASSEMBLY_STEPS[0].material;
    
    // 显示放置区
    this.showDropZone();
  }
  
  // 显示放置区
  showDropZone() {
    this.benchContent.innerHTML = '';
    
    const dropZone = document.createElement('div');
    dropZone.className = 'drop-zone';
    dropZone.id = 'dropZone';
    dropZone.innerHTML = `
      <div class="drop-zone-hint">
        <span class="drop-icon">📥</span>
        <span class="drop-text">将材料拖放到这里</span>
      </div>
    `;
    
    // 拖放事件
    dropZone.addEventListener('dragover', (e) => {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';
      dropZone.classList.add('active');
    });
    
    dropZone.addEventListener('dragleave', () => {
      dropZone.classList.remove('active');
    });
    
    dropZone.addEventListener('drop', (e) => {
      e.preventDefault();
      dropZone.classList.remove('active');
      const materialId = e.dataTransfer.getData('text/plain');
      this.handleMaterialDrop(materialId);
    });
    
    this.benchContent.appendChild(dropZone);
  }
  
  // 处理材料放置
  handleMaterialDrop(materialId) {
    if (!this.assemblyMode) return { success: false, message: '当前不在组装模式' };
    
    const apparatus = this.apparatuses[this.currentAssemblyIndex];
    const expectedStep = ASSEMBLY_STEPS[this.currentAssemblyStep];
    
    // 检查是否是期望的材料
    if (materialId !== expectedStep.material) {
      const result = { 
        success: false, 
        message: `现在需要添加${expectedStep.name}，请拖动正确的材料`,
        expected: expectedStep.material,
        received: materialId
      };
      if (this.onMaterialDropped) {
        this.onMaterialDropped(result);
      }
      return result;
    }
    
    // 添加材料到装置
    apparatus.addMaterial(materialId);
    this.currentAssemblyStep++;
    
    // 更新期望的下一个材料
    if (this.currentAssemblyStep < ASSEMBLY_STEPS.length) {
      this.expectedMaterial = ASSEMBLY_STEPS[this.currentAssemblyStep].material;
    } else {
      this.expectedMaterial = null;
    }
    
    // 渲染当前组装进度
    this.renderAssemblingApparatus();
    
    const result = {
      success: true,
      material: materialId,
      step: this.currentAssemblyStep,
      isComplete: apparatus.isAssembled(),
      nextMaterial: this.expectedMaterial
    };
    
    if (this.onMaterialDropped) {
      this.onMaterialDropped(result);
    }
    
    return result;
  }
  
  // 渲染正在组装的装置
  renderAssemblingApparatus() {
    const apparatus = this.apparatuses[this.currentAssemblyIndex];
    
    this.benchContent.innerHTML = '';
    
    // 创建装置容器
    const container = document.createElement('div');
    container.className = 'assembly-container';
    
    // 创建装置
    const div = document.createElement('div');
    div.className = 'apparatus assembling';
    div.id = `apparatus-${this.currentAssemblyIndex}`;
    
    // 根据组装进度渲染不同状态
    let cylinderContent = '';
    let balloonHtml = '';
    
    if (apparatus.hasCylinder) {
      // 量筒内容
      let liquidClass = 'cylinder-liquid';
      if (apparatus.hasWater) liquidClass += ' has-water';
      if (apparatus.hasYeast) liquidClass += ' has-yeast';
      if (apparatus.hasSugar) liquidClass += ' has-sugar';
      if (apparatus.hasStirred) liquidClass += ' stirred';
      
      cylinderContent = `
        <div class="apparatus-cylinder">
          <div class="${liquidClass}"></div>
        </div>
      `;
      
      // 气球（如果有）
      if (apparatus.hasBalloon) {
        const rubberBandClass = apparatus.hasRubberBand ? 'has-rubber-band' : '';
        balloonHtml = `<div class="apparatus-balloon small ${rubberBandClass}"></div>`;
      }
    }
    
    div.innerHTML = `
      ${balloonHtml}
      ${cylinderContent}
      <div class="apparatus-label">第${this.currentAssemblyIndex + 1}组</div>
    `;
    
    container.appendChild(div);
    
    // 如果还没组装完，在量筒上添加放置区
    if (!apparatus.isAssembled()) {
      const nextStep = ASSEMBLY_STEPS[this.currentAssemblyStep];
      
      // 创建覆盖在量筒上的放置区
      const dropOverlay = document.createElement('div');
      dropOverlay.className = 'drop-overlay';
      dropOverlay.id = 'dropZone';
      dropOverlay.innerHTML = `<span class="drop-hint-text">${nextStep ? `拖入${nextStep.name}` : ''}</span>`;
      
      // 拖放事件
      dropOverlay.addEventListener('dragover', (e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        dropOverlay.classList.add('active');
      });
      
      dropOverlay.addEventListener('dragleave', () => {
        dropOverlay.classList.remove('active');
      });
      
      dropOverlay.addEventListener('drop', (e) => {
        e.preventDefault();
        dropOverlay.classList.remove('active');
        const materialId = e.dataTransfer.getData('text/plain');
        this.handleMaterialDrop(materialId);
      });
      
      // 找到量筒元素并添加覆盖层
      const cylinderEl = div.querySelector('.apparatus-cylinder');
      if (cylinderEl) {
        cylinderEl.style.position = 'relative';
        cylinderEl.appendChild(dropOverlay);
      } else {
        // 如果还没有量筒，显示初始放置区
        container.appendChild(dropOverlay);
      }
    }
    
    this.benchContent.appendChild(container);
  }
  
  // 获取当前期望的材料
  getExpectedMaterial() {
    return this.expectedMaterial;
  }
  
  // 获取当前组装步骤信息
  getCurrentAssemblyStep() {
    if (this.currentAssemblyStep >= ASSEMBLY_STEPS.length) {
      return null;
    }
    return ASSEMBLY_STEPS[this.currentAssemblyStep];
  }
  
  // 结束组装模式
  endAssemblyMode() {
    this.assemblyMode = false;
    this.expectedMaterial = null;
  }
  
  // 自动组装剩余装置
  assembleRemainingApparatuses() {
    // 从第2个装置开始（索引1），自动组装
    for (let i = 1; i < config.ui.apparatusCount; i++) {
      const apparatus = this.apparatuses[i];
      apparatus.hasCylinder = true;
      apparatus.hasWater = true;
      apparatus.hasYeast = true;
      apparatus.hasSugar = true;
      apparatus.hasStirred = true;
      apparatus.hasBalloon = true;
      apparatus.hasRubberBand = true;
    }
    
    this.endAssemblyMode();
    this.renderApparatuses();
  }

  // ==================== 温度相关API ====================

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

  // 组装装置（完整组装）
  assembleApparatus(index, components = { cylinder: true, water: true, sugar: true, yeast: true, stirred: true, balloon: true, rubberBand: true }) {
    const apparatus = this.apparatuses[index];
    if (!apparatus) return;

    if (components.cylinder) apparatus.hasCylinder = true;
    if (components.water) apparatus.hasWater = true;
    if (components.sugar) apparatus.hasSugar = true;
    if (components.yeast) apparatus.hasYeast = true;
    if (components.stirred) apparatus.hasStirred = true;
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
        <div class="apparatus-label">第${i + 1}组</div>
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
    
    // 重置组装状态
    this.assemblyMode = false;
    this.currentAssemblyIndex = 0;
    this.currentAssemblyStep = 0;
    this.expectedMaterial = null;
    
    this.timerValue.textContent = '0小时';
    this.enableControlButtons({ start: false, pause: false, reset: false });
    
    // 重置装置
    this.apparatuses.forEach(apparatus => {
      apparatus.gasVolume = 0;
      apparatus.hasCylinder = false;
      apparatus.hasWater = false;
      apparatus.hasSugar = false;
      apparatus.hasYeast = false;
      apparatus.hasStirred = false;
      apparatus.hasBalloon = false;
      apparatus.hasRubberBand = false;
    });
    
    // 清空实验台
    this.benchContent.innerHTML = '<div class="empty-hint">实验台为空，请按照AI指引开始实验</div>';
    
    // 清空数据表格
    for (let i = 1; i <= config.ui.apparatusCount; i++) {
      const tempCell = document.getElementById(`temp-${i}`);
      if (tempCell) tempCell.textContent = '-';
      const input = document.getElementById(`volume-${i}`);
      if (input) {
        input.value = '';
        input.disabled = true;
        input.className = 'volume-input';
      }
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
      return { valid: false, correct: correctValue, message: `你填写的是${userValue}ml，再仔细看看第${index + 1}组上显示的数值哦` };
    }
  }
}
