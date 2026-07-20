import Taro from '@tarojs/taro';
import { AddressInfo, RoutePlanResult } from '@/types';

/**
 * 高德地图 API 服务
 * - 地理编码（地址 -> 经纬度）
 * - 驾车路径规划（起点 -> 终点，含距离/时间/红绿灯/高速/过路费）
 * - 方向计算（终点相对起点的方位）
 *
 * 高德开放平台 Key 由用户配置
 */

// 高德 Web 服务 API Key
const AMAP_KEY = '7cf8dcc0a6d9547f616dbfc90e9463b5';

// API 端点
const GEOCODE_URL = 'https://restapi.amap.com/v3/geocode/geo';
const RE_GEOCODE_URL = 'https://restapi.amap.com/v3/geocode/regeo';
const DRIVING_URL = 'https://restapi.amap.com/v5/direction/driving';

/**
 * 将地址字符串转换为经纬度
 * @param address 完整地址（如：四川省成都市武侯区天府大道北段1号）
 * @returns 经纬度字符串 "lng,lat" 或空字符串
 */
export async function geocodeAddress(address: string): Promise<{ longitude: string; latitude: string; formatted: string } | null> {
  if (!address || !address.trim()) return null;
  try {
    const res = await Taro.request({
      url: GEOCODE_URL,
      method: 'GET',
      data: {
        key: AMAP_KEY,
        address: address.trim(),
        output: 'JSON'
      }
    });
    const data = res.data as any;
    if (data && data.status === '1' && data.geocodes && data.geocodes.length > 0) {
      const geo = data.geocodes[0];
      const location = geo.location as string; // "lng,lat"
      const [lng, lat] = location.split(',');
      return {
        longitude: lng,
        latitude: lat,
        formatted: geo.formatted_address || address
      };
    }
    return null;
  } catch (err) {
    console.error('[amap] geocode error:', err);
    return null;
  }
}

/**
 * 逆地理编码：经纬度 -> 地址描述
 */
export async function reverseGeocode(longitude: string, latitude: string): Promise<AddressInfo | null> {
  if (!longitude || !latitude) return null;
  try {
    const res = await Taro.request({
      url: RE_GEOCODE_URL,
      method: 'GET',
      data: {
        key: AMAP_KEY,
        location: `${longitude},${latitude}`,
        extensions: 'base',
        output: 'JSON'
      }
    });
    const data = res.data as any;
    if (data && data.status === '1' && data.regeocode) {
      const addr = data.regeocode.addressComponent || {};
      const formatted = data.regeocode.formatted_address || '';
      return {
        province: addr.province || '',
        city: typeof addr.city === 'string' ? addr.city : (addr.province || ''),
        district: addr.district || '',
        detail: '',
        fullAddress: formatted,
        longitude,
        latitude
      };
    }
    return null;
  } catch (err) {
    console.error('[amap] regeocode error:', err);
    return null;
  }
}

/**
 * 根据起点、终点经纬度计算方位（中文方向）
 * @param startLng 起点经度
 * @param startLat 起点纬度
 * @param endLng 终点经度
 * @param endLat 终点纬度
 * @returns 方位描述（如：东北方、正南方）
 */
export function calcDirection(startLng: number, startLat: number, endLng: number, endLat: number): string {
  // 经度差（东西方向）
  const dLng = endLng - startLng;
  // 纬度差（南北方向）
  const dLat = endLat - startLat;

  // 角度（0-360），正东为 0，顺时针
  const angle = Math.atan2(dLat, dLng) * 180 / Math.PI;
  // 转换为方位（正北为 0，顺时针）
  let compass = 90 - angle;
  if (compass < 0) compass += 360;

  // 8 方位
  const directions = [
    { name: '正东方', min: 337.5, max: 22.5 },
    { name: '东北方', min: 22.5, max: 67.5 },
    { name: '正北方', min: 67.5, max: 112.5 },
    { name: '西北方', min: 112.5, max: 157.5 },
    { name: '正西方', min: 157.5, max: 202.5 },
    { name: '西南方', min: 202.5, max: 247.5 },
    { name: '正南方', min: 247.5, max: 292.5 },
    { name: '东南方', min: 292.5, max: 337.5 }
  ];

  for (const dir of directions) {
    if (dir.min > dir.max) {
      // 跨 0 度的情况（正东方）
      if (compass >= dir.min || compass < dir.max) return dir.name;
    } else {
      if (compass >= dir.min && compass < dir.max) return dir.name;
    }
  }
  return '前方';
}

/**
 * 驾车路径规划（v5 接口，返回红绿灯、高速、过路费等详细信息）
 * @param originLng 起点经度
 * @param originLat 起点纬度
 * @param destLng 终点经度
 * @param destLat 终点纬度
 * @param startName 起点名称
 * @param endName 终点名称
 */
export async function drivingRoute(
  originLng: string,
  originLat: string,
  destLng: string,
  destLat: string,
  startName = '我的位置',
  endName = '目的地'
): Promise<RoutePlanResult> {
  const origin = `${originLng},${originLat}`;
  const destination = `${destLng},${destLat}`;

  const empty: RoutePlanResult = {
    success: false,
    message: '路径规划失败',
    distance: 0,
    distanceKm: '0',
    duration: 0,
    durationMin: '0',
    direction: '未知',
    hasHighway: false,
    trafficLights: 0,
    tolls: 0,
    strategy: '',
    startName,
    endName,
    origin,
    destination
  };

  if (!originLng || !originLat || !destLng || !destLat) {
    return { ...empty, message: '地址经纬度缺失，请先在保单中录入完整地址' };
  }

  try {
    const res = await Taro.request({
      url: DRIVING_URL,
      method: 'GET',
      data: {
        key: AMAP_KEY,
        origin,
        destination,
        // strategy: 0 速度优先(默认)；2 距离优先；3 避免收费；5 多策略
        strategy: 0,
        show_fields: 'cost,tmcs,traffic_light' // 返回消耗信息、收费道路、红绿灯
      }
    });
    const data = res.data as any;
    if (data && data.errcode === 0 && data.route && data.route.paths && data.route.paths.length > 0) {
      const path = data.route.paths[0];
      const distance = parseInt(path.distance || '0', 10);
      const duration = parseInt(path.duration || '0', 10);
      // traffic_light 字段：红绿灯数量（v5 在 show_fields=traffic_light 时返回）
      const trafficLights = parseInt(path.traffic_light || '0', 10);
      const tolls = parseFloat(path.tolls || '0');
      const tollDistance = parseFloat(path.tolls_distance || '0');

      // 计算方向
      const direction = calcDirection(
        parseFloat(originLng), parseFloat(originLat),
        parseFloat(destLng), parseFloat(destLat)
      );

      // 判断是否上高速（途径主要道路类型检查 / 收费路段距离 > 0）
      const hasHighway = tollDistance > 0 || (() => {
        try {
          const steps = path.steps || [];
          for (const step of steps) {
            const tmcs = step.tmcs || [];
            for (const tmc of tmcs) {
              const roadName = (tmc.lname || '') as string;
              if (roadName.indexOf('高速') !== -1 || roadName.indexOf('快速路') !== -1) {
                return true;
              }
            }
          }
          return false;
        } catch {
          return false;
        }
      })();

      // 距离换算（米 -> 公里，保留1位小数）
      const distanceKm = (distance / 1000).toFixed(1);
      // 时间换算（秒 -> 分钟）
      const durationMin = Math.max(1, Math.round(duration / 60)).toString();

      // 策略描述
      let strategyDesc = '速度优先';
      if (tolls > 0) {
        strategyDesc = `含收费路段，过路费约 ${tolls} 元`;
      } else {
        strategyDesc = '免费路线';
      }

      return {
        success: true,
        message: '路径规划成功',
        distance,
        distanceKm,
        duration,
        durationMin,
        direction,
        hasHighway,
        trafficLights,
        tolls,
        strategy: strategyDesc,
        startName,
        endName,
        origin,
        destination
      };
    }
    return { ...empty, message: (data && (data.errmsg || data.info)) || '路径规划失败，请稍后重试' };
  } catch (err) {
    console.error('[amap] driving error:', err);
    return { ...empty, message: '网络请求失败，请检查网络后重试' };
  }
}

/**
 * 获取当前位置（小程序/H5 通用）
 * @returns 经纬度对象或 null
 */
export async function getCurrentLocation(): Promise<{ longitude: string; latitude: string } | null> {
  try {
    const pos = await Taro.getLocation({ type: 'gcj02', isHighAccuracy: true });
    return {
      longitude: pos.longitude.toString(),
      latitude: pos.latitude.toString()
    };
  } catch (err) {
    console.error('[amap] getLocation error:', err);
    return null;
  }
}

/**
 * 打开外部地图 App 进行导航
 * - 微信小程序：使用 wx.openLocation 打开内置地图
 * - H5：跳转到高德地图网页版
 */
export async function openNavigation(address: AddressInfo, endName = '目的地'): Promise<boolean> {
  if (!address || !address.longitude || !address.latitude) {
    Taro.showToast({ title: '地址缺少经纬度', icon: 'none' });
    return false;
  }
  try {
    const lng = parseFloat(address.longitude);
    const lat = parseFloat(address.latitude);
    await Taro.openLocation({
      longitude: lng,
      latitude: lat,
      name: endName,
      address: address.fullAddress || address.detail || '',
      scale: 18
    });
    return true;
  } catch (err) {
    console.error('[amap] openLocation error:', err);
    // H5 兜底：跳转高德 URI
    try {
      const url = `https://uri.amap.com/marker?position=${address.longitude},${address.latitude}&name=${encodeURIComponent(endName)}`;
      // @ts-ignore - H5 环境下存在 window 对象
      if (typeof window !== 'undefined') {
        // @ts-ignore
        window.open(url, '_blank');
        return true;
      }
      // 小程序兜底：复制链接到剪贴板
      await Taro.setClipboardData({ data: url });
      Taro.showToast({ title: '导航链接已复制', icon: 'none' });
      return true;
    } catch (e) {
      Taro.showToast({ title: '打开地图失败', icon: 'none' });
      return false;
    }
  }
}
