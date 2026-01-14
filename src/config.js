// AI探究导师 - 配置文件
export const config = {
  // DeepSeek API配置
  api: {
    baseUrl: 'https://api.deepseek.com/v1/chat/completions',
    apiKey: 'sk-a91a6fe1ad724088b1a1aa65b06f7dfe',
    model: 'deepseek-chat',
  },

  // 实验参数
  experiment: {
    // 时间设置：真实1秒 = 模拟1小时
    realSecondsPerHour: 1,
    totalHours: 8,
    
    // 温度范围
    temperatureMin: 10,
    temperatureMax: 60,
    temperatureDefault: 30,
    
    // 材料配置
    materials: {
      water: { amount: 10, unit: 'ml' },
      sugar: { amount: 5, unit: 'g' },
      yeast: { amount: 3, unit: 'g' },
    },
    
    // 气体体积计算公式参数（更新：取消50度分界点）
    gasFormula: {
      // 25℃≤温度时: 0.2ml/℃ * temp * hours
      normalRate: 0.2,
      normalMinTemp: 25,
      // <25°C: 0.02ml/°C * temp * hours
      lowTempRate: 0.02,
    },
  },

  // UI配置
  ui: {
    apparatusCount: 5, // 5组实验装置
    decimalPlaces: 2,  // 体积数值保留2位小数
  },
};

// 气体体积计算函数（更新：取消50度分界点）
export function calculateGasVolume(temperature, hours) {
  const { gasFormula } = config.experiment;
  
  if (temperature >= gasFormula.normalMinTemp) {
    // 25℃≤温度时: 正常发酵
    return gasFormula.normalRate * temperature * hours;
  } else {
    // <25°C: 低温抑制
    return gasFormula.lowTempRate * temperature * hours;
  }
}
