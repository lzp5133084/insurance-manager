export interface Insured {
  name: string;
  gender: string;
  age: string;
  birthday: string;
  relation: string;
}

export interface Visit {
  date: string;
  note: string;
}

/**
 * 详细地址信息
 */
export interface AddressInfo {
  province: string;      // 省
  city: string;          // 市
  district: string;      // 区/县
  detail: string;        // 详细地址（街道门牌号）
  fullAddress: string;   // 完整地址字符串
  longitude: string;     // 经度
  latitude: string;      // 纬度
}

export interface Customer {
  id: number;
  seq: number;
  name: string;
  gender: string;
  age: string;
  birthday: string;
  building: string;
  phone: string;
  community: string;
  address: AddressInfo;  // 详细地址（含经纬度）
  insuranceTypes: string[];
  insuranceContent: string;
  visits: Visit[];
  insured: Insured;
  createdAt: string;
  updatedAt: string;
}

export interface HistoryItem {
  type: string;
  content: string;
  time: string;
}

export interface Community {
  name: string;
  isDefault: boolean;
}

export interface InsuranceType {
  name: string;
  isDefault: boolean;
}

/**
 * 导航规划结果
 */
export interface RoutePlanResult {
  success: boolean;
  message: string;
  distance: number;          // 距离（米）
  distanceKm: string;        // 距离（公里，保留1位小数）
  duration: number;          // 预计驾驶时间（秒）
  durationMin: string;       // 预计驾驶时间（分钟）
  direction: string;         // 目的地所在方向
  hasHighway: boolean;       // 是否上高速
  trafficLights: number;     // 红绿灯数量
  tolls: number;             // 过路费（元）
  strategy: string;          // 路线策略描述
  startName: string;         // 起点名称
  endName: string;           // 终点名称
  origin: string;            // 起点经纬度
  destination: string;       // 终点经纬度
}
