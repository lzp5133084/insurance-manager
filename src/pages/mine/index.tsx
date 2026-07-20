import React, { useState, useEffect } from 'react';
import { View, Text, Button, ScrollView } from '@tarojs/components';
import Taro from '@tarojs/taro';
import styles from './index.module.scss';
import { getAllCustomers, showToast, addHistory, saveAllCustomers, getCommunities, saveCommunities } from '@/utils/storage';
import { Customer } from '@/types';

export default function MinePage() {
  const [programSize, setProgramSize] = useState('0');
  const [lastModified, setLastModified] = useState('--');

  useEffect(() => {
    updateMetaInfo();
  }, []);

  const updateMetaInfo = () => {
    const now = new Date();
    setLastModified(now.toLocaleString('zh-CN'));
    const customers = getAllCustomers();
    const size = (JSON.stringify(customers).length / 1024).toFixed(2);
    setProgramSize(size);
  };

  const exportCSV = () => {
    const customers: Customer[] = getAllCustomers();
    if (customers.length === 0) {
      showToast('暂无数据可导出', 'warning');
      return;
    }

    let csvContent = '\uFEFF序号,姓名,性别,年龄,出生年月日,被保人姓名,被保人性别,被保人年龄,被保人出生年月日,与客户关系,所属小区,单元楼号,联系电话,保险险种,保障内容,约访次数,见面备注\n';

    customers.forEach(customer => {
      const insurance = customer.insuranceTypes ? customer.insuranceTypes.join(';') : '';
      const visitCount = customer.visits ? customer.visits.length : 0;
      const visitNotes = customer.visits ? 
        customer.visits.map(v => `[${v.date}] ${(v.note || '').replace(/[\n\r]/g, ' ')}`).join('; ') : '';
      const insured = customer.insured || {};
      
      csvContent += `${customer.seq},` +
        `"${(customer.name || '').replace(/"/g, '""')}",` +
        `"${(customer.gender || '').replace(/"/g, '""')}",` +
        `"${(customer.age || '').replace(/"/g, '""')}",` +
        `"${(customer.birthday || '').replace(/"/g, '""')}",` +
        `"${(insured.name || '').replace(/"/g, '""')}",` +
        `"${(insured.gender || '').replace(/"/g, '""')}",` +
        `"${(insured.age || '').replace(/"/g, '""')}",` +
        `"${(insured.birthday || '').replace(/"/g, '""')}",` +
        `"${(insured.relation || '').replace(/"/g, '""')}",` +
        `"${(customer.community || '').replace(/"/g, '""')}",` +
        `"${(customer.building || '').replace(/"/g, '""')}",` +
        `"${(customer.phone || '').replace(/"/g, '""')}",` +
        `"${insurance.replace(/"/g, '""')}",` +
        `"${(customer.insuranceContent || '').replace(/"/g, '""')}",` +
        `${visitCount},` +
        `"${visitNotes.replace(/"/g, '""')}"\n`;
    });

    const filePath = `${Taro.env.USER_DATA_PATH}/客户数据_${new Date().toISOString().slice(0, 10)}.csv`;
    
    Taro.getFileSystemManager().writeFile({
      filePath,
      data: csvContent,
      encoding: 'utf8',
      success: () => {
        Taro.showToast({
          title: 'CSV导出成功',
          icon: 'success'
        });
        addHistory('数据导出', '导出CSV文件');
      },
      fail: () => {
        showToast('导出失败', 'error');
      }
    });
  };

  const exportExcel = () => {
    const customers: Customer[] = getAllCustomers();
    if (customers.length === 0) {
      showToast('暂无数据可导出', 'warning');
      return;
    }

    let html = '<table><thead><tr><th>序号</th><th>姓名</th><th>性别</th><th>年龄</th><th>出生年月日</th><th>被保人姓名</th><th>被保人性别</th><th>被保人年龄</th><th>被保人出生年月日</th><th>与客户关系</th><th>所属小区</th><th>单元楼号</th><th>联系电话</th><th>保险险种</th><th>保障内容</th><th>约访次数</th><th>见面备注</th></tr></thead><tbody>';

    customers.forEach(customer => {
      const insurance = customer.insuranceTypes ? customer.insuranceTypes.join('、') : '';
      const visitCount = customer.visits ? customer.visits.length : 0;
      const visitNotes = customer.visits ? 
        customer.visits.map(v => `[${v.date}] ${(v.note || '').replace(/</g, '&lt;').replace(/>/g, '&gt;')}`).join('; ') : '';
      const insured = customer.insured || {};
      const escapeHtml = (s: string) => (s || '').toString().replace(/</g, '&lt;').replace(/>/g, '&gt;');
      
      html += `<tr><td>${customer.seq}</td><td>${escapeHtml(customer.name)}</td><td>${escapeHtml(customer.gender)}</td><td>${escapeHtml(customer.age)}</td><td>${escapeHtml(customer.birthday)}</td><td>${escapeHtml(insured.name)}</td><td>${escapeHtml(insured.gender)}</td><td>${escapeHtml(insured.age)}</td><td>${escapeHtml(insured.birthday)}</td><td>${escapeHtml(insured.relation)}</td><td>${escapeHtml(customer.community)}</td><td>${escapeHtml(customer.building)}</td><td>${escapeHtml(customer.phone)}</td><td>${escapeHtml(insurance)}</td><td>${escapeHtml(customer.insuranceContent)}</td><td>${visitCount}</td><td>${visitNotes}</td></tr>`;
    });

    html += '</tbody></table>';

    const fullHtml = '<html><head><meta charset="UTF-8"><style>table{border-collapse:collapse;width:100%;}th,td{border:1px solid #ccc;padding:8px;text-align:left;white-space:pre-wrap;}th{background:#f0f0f0;}</style></head><body>' + html + '</body></html>';
    const filePath = `${Taro.env.USER_DATA_PATH}/客户数据_${new Date().toISOString().slice(0, 10)}.xls`;
    
    Taro.getFileSystemManager().writeFile({
      filePath,
      data: fullHtml,
      encoding: 'utf8',
      success: () => {
        Taro.showToast({
          title: 'Excel导出成功',
          icon: 'success'
        });
        addHistory('数据导出', '导出Excel文件');
      },
      fail: () => {
        showToast('导出失败', 'error');
      }
    });
  };

  const handleImport = () => {
    Taro.chooseFile({
      count: 1,
      extension: ['.csv'],
      success: (res) => {
        const tempFilePath = res.tempFiles[0].path;
        Taro.getFileSystemManager().readFile({
          filePath: tempFilePath,
          encoding: 'utf8',
          success: (readRes) => {
            parseAndImport(readRes.data, tempFilePath);
          },
          fail: () => {
            showToast('文件读取失败', 'error');
          }
        });
      },
      fail: () => {
        showToast('未选择文件', 'warning');
      }
    });
  };

  const parseAndImport = (content: string, filename: string) => {
    try {
      let data: any[] = [];
      
      if (filename.toLowerCase().endsWith('.csv')) {
        const lines = content.split(/\r?\n/).filter(l => l.trim());
        if (lines.length < 2) {
          showToast('文件中没有有效数据', 'warning');
          return;
        }
        
        const headers = lines[0].split(',').map(h => h.trim().replace(/^\uFEFF/, ''));
        
        for (let i = 1; i < lines.length; i++) {
          const values = parseCSVLine(lines[i]);
          const item: any = {};
          headers.forEach((h, idx) => {
            item[h] = values[idx] ? values[idx].trim() : '';
          });
          data.push(item);
        }
      } else {
        showToast('请选择CSV文件', 'warning');
        return;
      }
      
      importCustomers(data);
    } catch (err) {
      showToast('数据解析失败', 'error');
      console.error('导入解析错误:', err);
    }
  };

  const parseCSVLine = (line: string): string[] => {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;
    
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (inQuotes) {
        if (ch === '"') {
          if (line[i + 1] === '"') {
            current += '"';
            i++;
          } else {
            inQuotes = false;
          }
        } else {
          current += ch;
        }
      } else {
        if (ch === '"') {
          inQuotes = true;
        } else if (ch === ',') {
          result.push(current);
          current = '';
        } else {
          current += ch;
        }
      }
    }
    result.push(current);
    return result;
  };

  const importCustomers = (data: any[]) => {
    const existingCustomers = getAllCustomers();
    let importedCount = 0;
    let skippedCount = 0;
    
    const maxSeq = existingCustomers.length === 0 ? 0 : Math.max(...existingCustomers.map(c => c.seq || 0));
    let newSeq = maxSeq;
    
    const newCommunities: string[] = [];
    const existingCommunities = getCommunities();

    data.forEach(item => {
      const name = item['姓名'] || item['name'] || '';
      const phone = item['联系电话'] || item['phone'] || item['手机号'] || '';
      
      if (!name || !phone) {
        skippedCount++;
        return;
      }
      
      if (existingCustomers.some(c => c.name === name && c.phone === phone)) {
        skippedCount++;
        return;
      }
      
      const community = (item['所属小区'] || item['community'] || '').trim();
      if (community && existingCommunities.indexOf(community) === -1 && newCommunities.indexOf(community) === -1) {
        newCommunities.push(community);
      }
      
      newSeq++;
      
      const newCustomer: Customer = {
        id: Date.now() + Math.random(),
        seq: newSeq,
        name: name,
        gender: item['性别'] || item['gender'] || '',
        age: item['年龄'] || item['age'] || '',
        birthday: item['出生年月日'] || item['出生日期'] || item['birthday'] || '',
        building: item['单元楼号'] || item['building'] || '',
        phone: phone,
        community: community,
        address: {
          province: '',
          city: '',
          district: '',
          detail: item['详细地址'] || item['address'] || '',
          fullAddress: item['详细地址'] || item['address'] || '',
          longitude: '',
          latitude: ''
        },
        insuranceTypes: [],
        insuranceContent: item['保障内容'] || '',
        visits: [],
        insured: {
          name: item['被保人姓名'] || '',
          gender: item['被保人性别'] || '',
          age: item['被保人年龄'] || '',
          birthday: item['被保人出生年月日'] || '',
          relation: item['与客户关系'] || ''
        },
        createdAt: new Date().toLocaleString('zh-CN'),
        updatedAt: new Date().toLocaleString('zh-CN')
      };
      
      existingCustomers.push(newCustomer);
      importedCount++;
    });
    
    if (newCommunities.length > 0) {
      const allCommunities = existingCommunities.concat(newCommunities);
      saveCommunities(allCommunities);
    }
    
    saveAllCustomers(existingCustomers);
    updateMetaInfo();
    
    showToast(`导入完成: 成功 ${importedCount} 条, 跳过 ${skippedCount} 条`, 'success');
    addHistory('数据导入', `导入客户数据: 成功${importedCount}条, 跳过${skippedCount}条`);
  };

  const clearAllData = () => {
    Taro.showModal({
      title: '确认清空',
      content: '确定要清空所有客户数据吗？此操作不可恢复！',
      success: (res) => {
        if (res.confirm) {
          saveAllCustomers([]);
          updateMetaInfo();
          showToast('数据已清空', 'success');
          addHistory('数据管理', '清空所有客户数据');
        }
      }
    });
  };

  return (
    <ScrollView className={styles.container} scrollY>
      <View className={styles.metaBar}>
        <Text>程序大小: {programSize} KB | 上次修改: {lastModified} | 作者: 鞠诗涵·平安网格 (微信: Han18783095178)</Text>
      </View>

      <View className={styles.section}>
        <Text className={styles.sectionTitle}>数据管理</Text>
        <View className={styles.btnGroup}>
          <Button className={`${styles.btn} ${styles.btnPrimary}`} onClick={exportCSV}>
            <Text>导出CSV文件</Text>
          </Button>
          <Button className={`${styles.btn} ${styles.btnSuccess}`} onClick={exportExcel}>
            <Text>导出Excel文件</Text>
          </Button>
          <Button className={`${styles.btn} ${styles.btnNeutral}`} onClick={handleImport}>
            <Text>导入数据</Text>
          </Button>
          <Button className={`${styles.btn} ${styles.btnWarning}`} onClick={clearAllData}>
            <Text>清空所有数据</Text>
          </Button>
        </View>
      </View>

      <View className={styles.section}>
        <Text className={styles.sectionTitle}>关于程序</Text>
        <View className={styles.infoList}>
          <View className={styles.infoItem}>
            <Text className={styles.infoLabel}>版本</Text>
            <Text className={styles.infoValue}>v1.0.0</Text>
          </View>
          <View className={styles.infoItem}>
            <Text className={styles.infoLabel}>开发者</Text>
            <Text className={styles.infoValue}>鞠诗涵</Text>
          </View>
          <View className={styles.infoItem}>
            <Text className={styles.infoLabel}>所属团队</Text>
            <Text className={styles.infoValue}>平安网格</Text>
          </View>
          <View className={styles.infoItem}>
            <Text className={styles.infoLabel}>联系微信</Text>
            <Text className={styles.infoValue}>Han18783095178</Text>
          </View>
        </View>
      </View>

      <View className={styles.card}>
        <Text className={styles.cardTitle}>功能说明</Text>
        <View style={{ fontSize: '26rpx', color: '#94a3b8', lineHeight: '2' }}>
          <Text>• 客户信息管理：支持增删改查客户数据</Text>
          <Text>\n• 被保人管理：记录被保人详细信息</Text>
          <Text>\n• 小区管理：自定义小区列表</Text>
          <Text>\n• 保险管理：记录险种和保障内容</Text>
          <Text>\n• 约访记录：记录客户见面备注</Text>
          <Text>\n• 数据统计：小区人数、客户总数统计</Text>
          <Text>\n• 数据导入导出：支持CSV/Excel格式</Text>
        </View>
      </View>
    </ScrollView>
  );
}