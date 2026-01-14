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
};

// 材料区管理类
export class MaterialsManager {
  constructor(containerId) {
    this.container = document.getElementById(containerId);
    this.materials = {};
    this.selectedMaterial = null;
    this.onMaterialClick = null;
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
    item.innerHTML = `
      <span class="material-icon">${material.icon}</span>
      <span class="material-name">${material.name}</span>
      ${material.amount ? `<span class="material-amount">${material.amount}</span>` : ''}
    `;

    item.addEventListener('click', () => {
      this.selectMaterial(material.id);
      if (this.onMaterialClick) {
        this.onMaterialClick(material.id);
      }
    });

    this.container.appendChild(item);
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
