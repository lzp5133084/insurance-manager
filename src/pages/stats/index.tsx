import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView } from '@tarojs/components';
import styles from './index.module.scss';
import StatCard from '@/components/StatCard';
import { getAllCustomers, getCommunities, getHistory } from '@/utils/storage';
import { Customer, HistoryItem } from '@/types';

export default function StatsPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [communities, setCommunities] = useState<string[]>([]);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [todayCount, setTodayCount] = useState(0);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    const allCustomers = getAllCustomers();
    setCustomers(allCustomers);
    setCommunities(getCommunities());
    setHistory(getHistory());
    
    const today = new Date().toDateString();
    const count = allCustomers.filter(c => 
      c.createdAt && new Date(c.createdAt).toDateString() === today
    ).length;
    setTodayCount(count);
  };

  const getCommunityStats = () => {
    const stats = communities.map(name => ({
      name,
      count: customers.filter(c => c.community === name).length
    }));
    const total = stats.reduce((sum, s) => sum + s.count, 0);
    return { stats, total };
  };

  const colors = ['#3b82f6', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444', '#ec4899', '#06b6d4', '#84cc16', '#f97316', '#6366f1'];

  const { stats, total } = getCommunityStats();

  return (
    <ScrollView className={styles.container} scrollY>
      <View className={styles.statsRow}>
        <StatCard value={customers.length} label="总客户数" color="#3b82f6" />
        <StatCard value={todayCount} label="今日新增" color="#10b981" />
        <StatCard value={communities.length} label="小区数量" color="#8b5cf6" />
      </View>

      <View className={styles.card}>
        <Text className={styles.cardTitle}>小区人数统计</Text>
        <View className={styles.communityStats}>
          {stats.map((s, i) => {
            const color = colors[i % colors.length];
            const percentage = total > 0 ? ((s.count / total) * 100).toFixed(1) : 0;
            return (
              <View key={s.name} className={styles.communityStat}>
                <View className={styles.communityCircle} style={{ background: color }}>
                  <Text>{s.count}</Text>
                </View>
                <View className={styles.communityName}>
                  <Text>{s.name}</Text>
                </View>
                <View className={styles.communityPercentage}>
                  <Text>{percentage}%</Text>
                </View>
              </View>
            );
          })}
        </View>
        {total > 0 && (
          <View className={styles.emptyTip}>
            <Text>总客户数: {total}</Text>
          </View>
        )}
      </View>

      <View className={styles.card}>
        <Text className={styles.cardTitle}>操作记录</Text>
        <View className={styles.historyList}>
          {history.length === 0 ? (
            <View className={styles.emptyTip}>
              <Text>暂无操作记录</Text>
            </View>
          ) : (
            history.map((h, idx) => (
              <View key={idx} className={styles.historyItem}>
                <View>
                  <Text className={styles.historyType}>{h.type}</Text>
                  <Text className={styles.historyContent}>{h.content}</Text>
                </View>
                <Text className={styles.historyTime}>{h.time}</Text>
              </View>
            ))
          )}
        </View>
      </View>
    </ScrollView>
  );
}