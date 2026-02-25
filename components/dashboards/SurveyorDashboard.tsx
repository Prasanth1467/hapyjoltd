import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Card } from '@/components/ui/Card';
import { Header } from '@/components/ui/Header';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { DashboardLayout } from '@/components/ui/DashboardLayout';
import { useAuth } from '@/context/AuthContext';
import { useLocale } from '@/context/LocaleContext';
import { useMockAppStore } from '@/context/MockAppStoreContext';
import { MapPin, Calendar, Camera, Plus } from 'lucide-react-native';
import { colors, layout } from '@/theme/tokens';
import type { DashboardNavProps } from '@/components/RoleBasedDashboard';

export function SurveyorDashboard({ onNavigateTab }: DashboardNavProps = {}) {
  const { user } = useAuth();
  const { t } = useLocale();
  const { surveys } = useMockAppStore();
  const mySurveys = surveys.filter((survey) => survey.surveyorId === user?.id);

  const statusVariant = {
    draft: 'default' as const,
    submitted: 'warning' as const,
    approved: 'success' as const,
  };

  return (
    <View style={styles.screen}>
      <Header
        title={t('dashboard_surveyor_title')}
        subtitle={user?.name ? `${t('dashboard_welcome_name')}, ${user.name}` : ''}
        rightAction={
          <TouchableOpacity onPress={() => onNavigateTab?.('surveys')} style={surveyorStyles.headerBtn}>
            <Plus size={18} color="#ffffff" />
            <Text style={surveyorStyles.headerBtnText}>{t('surveys_new_button')}</Text>
          </TouchableOpacity>
        }
      />
      <DashboardLayout>
        {/* Quick Stats */}
        <View className="flex-row mb-4 gap-3">
          <Card className="flex-1 bg-blue-50">
            <View className="items-center py-3">
              <Text className="text-2xl font-bold text-gray-900">
                {mySurveys.filter((s) => s.status === 'draft').length}
              </Text>
              <Text className="text-xs text-gray-600 mt-1">{t('dashboard_drafts')}</Text>
            </View>
          </Card>
          <Card className="flex-1 bg-yellow-50">
            <View className="items-center py-3">
              <Text className="text-2xl font-bold text-gray-900">
                {mySurveys.filter((s) => s.status === 'submitted').length}
              </Text>
              <Text className="text-xs text-gray-600 mt-1">{t('dashboard_submitted')}</Text>
            </View>
          </Card>
          <Card className="flex-1 bg-green-50">
            <View className="items-center py-3">
              <Text className="text-2xl font-bold text-gray-900">
                {mySurveys.filter((s) => s.status === 'approved').length}
              </Text>
              <Text className="text-xs text-gray-600 mt-1">{t('surveys_approved_list')}</Text>
            </View>
          </Card>
        </View>

        {/* Recent Surveys */}
        <View className="mb-4">
          <Text className="text-lg font-bold text-gray-900 mb-3">{t('surveys_approved_list')}</Text>
          {mySurveys.map((survey) => (
            <Card key={survey.id} className="mb-3">
              <View className="flex-row items-start justify-between mb-2">
                <Text className="text-base font-bold text-gray-900 flex-1">{survey.type}</Text>
                <Badge variant={statusVariant[survey.status]} size="sm">
                  {survey.status}
                </Badge>
              </View>

              <View className="flex-row items-center mb-2">
                <MapPin size={14} color="#6B7280" />
                <Text className="text-sm text-gray-600 ml-1">{survey.siteName}</Text>
              </View>

              <View className="flex-row items-center mb-3">
                <Calendar size={14} color="#6B7280" />
                <Text className="text-sm text-gray-600 ml-1">{survey.createdAt}</Text>
              </View>

              {survey.workVolume != null && (
                <View className="bg-blue-50 rounded-lg p-2 mb-2">
                  <Text className="text-sm font-semibold text-gray-900">
                    {survey.workVolume.toFixed(2)} m³
                  </Text>
                  <Text className="text-xs text-gray-600">{t('surveys_work_volume')}</Text>
                </View>
              )}

              {survey.location && (
                <View className="bg-gray-50 rounded p-2 mb-3">
                  <Text className="text-xs text-gray-600">
                    GPS: {survey.location.latitude.toFixed(4)}, {survey.location.longitude.toFixed(4)}
                  </Text>
                </View>
              )}

              <View className="flex-row justify-between pt-3 border-t border-gray-200">
                <View className="flex-row items-center">
                  <Camera size={14} color="#6B7280" />
                  <Text className="text-xs text-gray-600 ml-1">
                    {survey.photos?.length || 0} {t('common_photos')}
                  </Text>
                </View>
                {survey.status === 'draft' && (
                  <TouchableOpacity>
                    <Text className="text-sm text-blue-600 font-semibold">{t('common_continue')}</Text>
                  </TouchableOpacity>
                )}
              </View>
            </Card>
          ))}
        </View>

        {/* Quick Actions */}
        <Card className="bg-blue-600 mb-4">
          <View className="py-2">
            <Text className="text-white font-bold text-base mb-3">{t('dashboard_quick_actions')}</Text>
            <Button variant="outline" className="bg-white mb-2">
              <Text className="text-blue-600 font-semibold">{t('surveys_new_survey')}</Text>
            </Button>
            <Button variant="outline" className="bg-white">
              <Text className="text-blue-600 font-semibold">{t('surveys_view')}</Text>
            </Button>
          </View>
        </Card>
      </DashboardLayout>
    </View>
  );
}

const styles = StyleSheet.create({ screen: { flex: 1, backgroundColor: colors.background } });
const surveyorStyles = StyleSheet.create({
  headerBtn: { backgroundColor: colors.primary, borderRadius: layout.cardRadius, paddingHorizontal: layout.cardPadding, paddingVertical: layout.grid, flexDirection: 'row', alignItems: 'center' },
  headerBtnText: { color: '#fff', fontWeight: '600', marginLeft: 4 },
});
