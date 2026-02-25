import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import * as Location from 'expo-location';
import { Card } from '@/components/ui/Card';
import { TaskCard } from '@/components/tasks/TaskCard';
import { TaskDetailScreen } from '@/components/tasks/TaskDetailScreen';
import { Header } from '@/components/ui/Header';
import { EmptyState } from '@/components/ui/EmptyState';
import { DashboardLayout } from '@/components/ui/DashboardLayout';
import { useAuth } from '@/context/AuthContext';
import { useLocale } from '@/context/LocaleContext';
import { useMockAppStore } from '@/context/MockAppStoreContext';
import { getRoleLabelKey } from '@/lib/rbac';
import { colors } from '@/theme/tokens';
import { Truck, CheckCircle2, Clock, AlertCircle } from 'lucide-react-native';
import type { Task } from '@/types';
import type { DashboardNavProps } from '@/components/RoleBasedDashboard';

export function DriverDashboard(_props: DashboardNavProps = {}) {
  const { t } = useLocale();
  const { user } = useAuth();
  const { tasks, updateUser } = useMockAppStore();
  const userId = user?.id ?? '';

  // Report driver location on login when dashboard mounts (strict: every time driver is on app)
  useEffect(() => {
    const isDriver = user?.role === 'driver_truck' || user?.role === 'driver_machine';
    if (!userId || !isDriver) return;
    let mounted = true;
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted' || !mounted) return;
      const myTrips = tasks.filter((t) => t.assignedTo.includes(userId));
      const hasActiveTrip = myTrips.some((t) => t.status === 'in_progress');
      if (hasActiveTrip) return;
      try {
        const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
        if (!mounted) return;
        await updateUser(userId, {
          lastLat: pos.coords.latitude,
          lastLon: pos.coords.longitude,
          locationUpdatedAt: new Date().toISOString(),
        });
      } catch { /* ignore location errors */ }
    })();
    return () => { mounted = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- tasks used only to skip when driver has active trip
  }, [userId, user?.role, updateUser]);
  const myTasks = tasks.filter((task) => task.assignedTo.includes(user?.id || ''));
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);

  const isTruck = user?.role === 'driver_truck';
  const roleLabel = user?.role ? t(getRoleLabelKey(user.role)) : '';
  const title = isTruck ? t('driver_my_trips') : t('driver_my_sessions');
  const subtitle = user?.name ? `${t('driver_welcome_back')}, ${user.name}` : (isTruck ? t('driver_truck_driver') : t('driver_machine_operator'));

  if (selectedTask) {
    return (
      <TaskDetailScreen
        task={selectedTask}
        onBack={() => setSelectedTask(null)}
      />
    );
  }

  const pendingTasks = myTasks.filter((taskItem) => taskItem.status === 'pending').length;
  const inProgressTasks = myTasks.filter((taskItem) => taskItem.status === 'in_progress').length;
  const completedTasks = myTasks.filter((taskItem) => taskItem.status === 'completed').length;

  const stats = [
    {
      icon: <Clock size={20} color="#F59E0B" />,
      label: t('task_pending'),
      value: pendingTasks,
      bg: 'bg-yellow-50',
    },
    {
      icon: <AlertCircle size={20} color="#3B82F6" />,
      label: t('task_in_progress'),
      value: inProgressTasks,
      bg: 'bg-blue-50',
    },
    {
      icon: <CheckCircle2 size={20} color="#10B981" />,
      label: t('task_completed'),
      value: completedTasks,
      bg: 'bg-green-50',
    },
  ];

  return (
    <View style={styles.screen}>
      <Header title={title} subtitle={subtitle} />
      <DashboardLayout>
        {roleLabel ? (
          <View className="mb-3 flex-row">
            <View className="bg-blue-100 px-3 py-1.5 rounded-lg">
              <Text className="text-sm font-semibold text-blue-800">{roleLabel}</Text>
            </View>
          </View>
        ) : null}
        {/* Stats */}
        <View className="flex-row mb-4 gap-3">
          {stats.map((stat, index) => (
            <Card key={index} className={`flex-1 ${stat.bg}`}>
              <View className="items-center py-2">
                {stat.icon}
                <Text className="text-xl font-bold text-gray-900 mt-1">{stat.value}</Text>
                <Text className="text-xs text-gray-600">{stat.label}</Text>
              </View>
            </Card>
          ))}
        </View>

        {/* Tasks List */}
        <View className="mb-4">
          <Text className="text-lg font-bold text-gray-900 mb-3">{t('tab_tasks')}</Text>
          {myTasks.length > 0 ? (
            myTasks.map((task) => <TaskCard key={task.id} task={task} onPress={() => setSelectedTask(task)} />)
          ) : (
            <EmptyState
              icon={<Truck size={48} color="#9CA3AF" />}
              title={t('driver_no_tasks')}
              message={t('driver_no_tasks_message')}
            />
          )}
        </View>
      </DashboardLayout>
    </View>
  );
}

const styles = StyleSheet.create({ screen: { flex: 1, backgroundColor: colors.background } });
