import Taro from '@tarojs/taro';
import { Customer, HistoryItem } from '@/types';

const CUSTOMER_KEY = 'zhihui_customers';
const HISTORY_KEY = 'zhihui_history';
const COMMUNITY_KEY = 'zhihui_communities';
const INSURANCE_KEY = 'zhihui_insurance_types';

const DEFAULT_COMMUNITIES = ['博雅馨城', '育苗佳苑', '西延锦绣', '红色佳苑', '锦熙玉苑', '西西里公园', '金港湾花园', '福祥瑞康苑', '福祥瑞祥苑', '福祥瑞福苑'];
const DEFAULT_INSURANCE_TYPES = ['保障型', '两全险', '理财险', '寿险', '重疾险', '意外险', '医疗险', '终身险', '中短期险', '一年期保险'];

export function getAllCustomers(): Customer[] {
  try {
    const data = Taro.getStorageSync(CUSTOMER_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

export function saveAllCustomers(customers: Customer[]): void {
  Taro.setStorageSync(CUSTOMER_KEY, JSON.stringify(customers));
}

export function getHistory(): HistoryItem[] {
  try {
    const data = Taro.getStorageSync(HISTORY_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

export function saveHistory(history: HistoryItem[]): void {
  Taro.setStorageSync(HISTORY_KEY, JSON.stringify(history));
}

export function addHistory(type: string, content: string): void {
  const history = getHistory();
  history.unshift({
    type,
    content,
    time: new Date().toLocaleString('zh-CN')
  });
  if (history.length > 50) {
    history.splice(50);
  }
  saveHistory(history);
}

export function getCommunities(): string[] {
  try {
    const data = Taro.getStorageSync(COMMUNITY_KEY);
    if (data) {
      return JSON.parse(data);
    }
    saveCommunities(DEFAULT_COMMUNITIES);
    return DEFAULT_COMMUNITIES;
  } catch {
    saveCommunities(DEFAULT_COMMUNITIES);
    return DEFAULT_COMMUNITIES;
  }
}

export function saveCommunities(list: string[]): void {
  Taro.setStorageSync(COMMUNITY_KEY, JSON.stringify(list));
}

export function getInsuranceTypes(): string[] {
  try {
    const data = Taro.getStorageSync(INSURANCE_KEY);
    if (data) {
      return JSON.parse(data);
    }
    saveInsuranceTypes(DEFAULT_INSURANCE_TYPES);
    return DEFAULT_INSURANCE_TYPES;
  } catch {
    saveInsuranceTypes(DEFAULT_INSURANCE_TYPES);
    return DEFAULT_INSURANCE_TYPES;
  }
}

export function saveInsuranceTypes(list: string[]): void {
  Taro.setStorageSync(INSURANCE_KEY, JSON.stringify(list));
}

export function deleteCustomer(id: number): void {
  const customers = getAllCustomers();
  const filtered = customers.filter(c => c.id !== id);
  saveAllCustomers(filtered);
}

export function generateSeq(): number {
  const customers = getAllCustomers();
  if (customers.length === 0) return 1;
  return Math.max(...customers.map(c => c.seq || 0)) + 1;
}

export function showToast(msg: string, type: 'success' | 'warning' | 'error' = 'success'): void {
  Taro.showToast({
    title: msg,
    icon: type === 'success' ? 'success' : type === 'error' ? 'error' : 'none',
    duration: 2500
  });
}