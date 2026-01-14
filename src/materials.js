// 材料区模块 - 管理实验材料的显示和交互

// 所有可用材料定义
export const MATERIALS = {
  yeast: { id: 'yeast', name: '酵母菌', icon: '🦠', amount: '3g' },
  dough: { id: 'dough', name: '面团', icon: '🫓', amount: '' },
  water: { id: 'water', name: '水', icon: '💧', amount: '10ml' },
  sugar: { id: 'sugar', name: '白砂糖', icon: '🧂', amount: '5g' },
  cylinder: { id: 'cylinder', name: '量筒', icon: '🧪', amount: '' },
  balloon: { id: 'balloon', name: '气球', icon: '🎈', amount: '' },
  rubberBand: { id: 'rubberBand', name: '皮筋', icon: '⭕', amount: '' },
  stirringRod: { id: 'stirringRod', name: '搅拌棒', icon: '🥢', amount: '' },
};

// 材料区管理类
export class MaterialsManager {
  constructor(containerId) {
    this.container = document.getElementById(containerId);
    this.materials = {};
    this.selectedMaterial = null;
    this.onMaterialClick = null;
    this.onMaterialDrag = null;  // 拖拽回调
    this.dragEnabled = false;    // 是否启用拖拽
    this.expectedMaterial = null; // 期望的材料ID
  }

  // 显示指定的材料
  showMaterials(materialIds) {
    this.container.innerHTML = '';
    this.materials = {};

    materialIds.forEach(id => {
      if (MATERIALS[id]) {
        const material = { ...MATERIALS[id] };
        this.materials[id] = material;
        this.renderMaterial(material);
      }
    });
  }

  // 渲染单个材料
  renderMaterial(material) {
    const item = document.createElement('div');
    item.className = 'material-item';
    item.dataset.id = material.id;
    item.draggable = this.dragEnabled; // 根据状态设置是否可拖拽
    
    item.innerHTML = `
      <span class="material-icon">${material.icon}</span>
      <span class="material-name">${material.name}</span>
      ${material.amount ? `<span class="material-amount">${material.amount}</span>` : ''}
    `;

    // 点击事件
    item.addEventListener('click', () => {
      this.selectMaterial(material.id);
      if (this.onMaterialClick) {
        this.onMaterialClick(material.id);
      }
    });
    
    // 拖拽事件
    item.addEventListener('dragstart', (e) => {
      if (!this.dragEnabled) {
        e.preventDefault();
        return;
      }
      e.dataTransfer.setData('text/plain', material.id);
      e.dataTransfer.effectAllowed = 'move';
      item.classList.add('dragging');
    });
    
    item.addEventListener('dragend', () => {
      item.classList.remove('dragging');
    });

    this.container.appendChild(item);
  }
  
  // 启用拖拽模式
  enableDrag(enable = true) {
    this.dragEnabled = enable;
    const items = this.container.querySelectorAll('.material-item');
    items.forEach(item => {
      item.draggable = enable;
      if (enable) {
        item.classList.add('draggable');
      } else {
        item.classList.remove('draggable');
      }
    });
  }
  
  // 设置期望的材料（高亮提示）
  setExpectedMaterial(materialId) {
    this.expectedMaterial = materialId;
    // 移除所有期望高亮
    const items = this.container.querySelectorAll('.material-item');
    items.forEach(item => {
      item.classList.remove('expected');
    });
    // 添加期望高亮
    if (materialId) {
      const item = this.container.querySelector(`[data-id="${materialId}"]`);
      if (item) {
        item.classList.add('expected');
      }
    }
  }
  
  // 标记材料为已使用
  markAsUsed(materialId) {
    const item = this.container.querySelector(`[data-id="${materialId}"]`);
    if (item) {
      item.classList.add('used');
      item.draggable = false;
    }
  }
  
  // 重置所有材料状态
  resetMaterialsState() {
    const items = this.container.querySelectorAll('.material-item');
    items.forEach(item => {
      item.classList.remove('used', 'expected', 'dragging');
      item.draggable = this.dragEnabled;
    });
  }

  // 选中材料
  selectMaterial(id) {
    // 取消之前的选中
    const prevSelected = this.container.querySelector('.selected');
    if (prevSelected) {
      prevSelected.classList.remove('selected');
    }

    // 选中新材料
    const item = this.container.querySelector(`[data-id="${id}"]`);
    if (item) {
      item.classList.add('selected');
      this.selectedMaterial = id;
    }
  }

  // 高亮材料
  highlightMaterial(id) {
    const item = this.container.querySelector(`[data-id="${id}"]`);
    if (item) {
      item.style.animation = 'pulse 0.5s ease 3';
      setTimeout(() => {
        item.style.animation = '';
      }, 1500);
    }
  }

  // 获取选中的材料
  getSelectedMaterial() {
    return this.selectedMaterial;
  }

  // 清空材料区
  clear() {
    this.container.innerHTML = '<div class="empty-hint">材料区为空</div>';
    this.materials = {};
    this.selectedMaterial = null;
  }
}
