import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert, Modal, TextInput, Pressable, Keyboard } from 'react-native';
import { Card } from '@/components/ui/Card';
import { Header } from '@/components/ui/Header';
import { SiteCard } from '@/components/sites/SiteCard';
import { SiteDetailScreen } from '@/components/screens/SiteDetailScreen';
import { useAuth } from '@/context/AuthContext';
import { useLocale } from '@/context/LocaleContext';
import { useMockAppStore } from '@/context/MockAppStoreContext';
import { useResponsiveTheme } from '@/theme/responsive';
import { generateId } from '@/lib/id';
import { Plus } from 'lucide-react-native';

export function SitesScreen() {
  const { user } = useAuth();
  const { t } = useLocale();
  const theme = useResponsiveTheme();
  const { sites, updateSite, addSite, loading } = useMockAppStore();
  const isHeadSupervisor = user?.role === 'head_supervisor';
  const [budgetModalVisible, setBudgetModalVisible] = useState(false);
  const [allocateSiteId, setAllocateSiteId] = useState<string | null>(null);
  const [amountRwf, setAmountRwf] = useState('');
  const [detailSiteId, setDetailSiteId] = useState<string | null>(null);
  const [createSiteModalVisible, setCreateSiteModalVisible] = useState(false);
  const [newSiteName, setNewSiteName] = useState('');
  const [newSiteLocation, setNewSiteLocation] = useState('');
  const [newSiteBudget, setNewSiteBudget] = useState('');

  const handleAllocateBudget = () => {
    setAllocateSiteId(sites[0]?.id ?? null);
    setAmountRwf('');
    setBudgetModalVisible(true);
  };

  const handleConfirmBudget = async () => {
    const amount = parseInt(amountRwf, 10);
    if (!allocateSiteId || isNaN(amount) || amount <= 0) {
      Alert.alert(t('sites_invalid_input_title'), t('sites_invalid_input'));
      return;
    }
    try {
      await updateSite(allocateSiteId, { budget: amount });
      setBudgetModalVisible(false);
    } catch {
      Alert.alert(t('sites_error_title'), t('sites_budget_update_failed'));
    }
  };

  const selectedSite = detailSiteId ? sites.find((s) => s.id === detailSiteId) : null;

  const handleCreateSite = () => {
    setNewSiteName('');
    setNewSiteLocation('');
    setNewSiteBudget('');
    setCreateSiteModalVisible(true);
  };

  const handleConfirmCreateSite = async () => {
    const name = newSiteName.trim();
    const location = newSiteLocation.trim();
    if (!name || !location) {
      Alert.alert(t('sites_required_fields_title'), t('sites_required_fields'));
      return;
    }
    const budget = parseInt(newSiteBudget, 10) || 0;
    const id = generateId('site');
    try {
      await addSite({
        id,
        name,
        location,
        status: 'active',
        startDate: new Date().toISOString().slice(0, 10),
        budget: budget > 0 ? budget : 1000000,
        spent: 0,
        progress: 0,
      });
      setCreateSiteModalVisible(false);
    } catch {
      Alert.alert(t('sites_error_title'), t('sites_create_failed'));
    }
  };

  if (selectedSite) {
    return (
      <SiteDetailScreen
        site={selectedSite}
        onBack={() => setDetailSiteId(null)}
      />
    );
  }

  return (
    <View className="flex-1 bg-gray-50">
      <Header
        title={t('sites_title')}
        subtitle={t('sites_subtitle')}
        rightAction={
          isHeadSupervisor ? (
            <TouchableOpacity
              onPress={handleAllocateBudget}
              className="bg-blue-600 rounded-lg px-4 py-2 flex-row items-center mr-2"
            >
              <Text className="text-white font-semibold">{t('sites_allocate_budget')}</Text>
            </TouchableOpacity>
          ) : null
        }
      />
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ padding: theme.screenPadding }}
        keyboardShouldPersistTaps="handled"
        onScrollBeginDrag={() => Keyboard.dismiss()}
      >
        {loading ? (
          <Card className="py-8">
            <Text className="text-center text-gray-600">{t('sites_loading')}</Text>
          </Card>
        ) : (
          <>
        {user?.role === 'head_supervisor' && (
          <TouchableOpacity onPress={handleCreateSite} className="mb-4">
            <Card className="bg-blue-50 border border-blue-200 border-dashed">
              <View className="flex-row items-center py-3">
                <View className="w-10 h-10 bg-blue-100 rounded-lg items-center justify-center mr-3">
                  <Plus size={20} color="#2563EB" />
                </View>
                <Text className="text-blue-700 font-semibold">{t('sites_create_new_site')}</Text>
              </View>
            </Card>
          </TouchableOpacity>
        )}

        <View className="mb-4">
          <Text className="text-lg font-bold text-gray-900 mb-3">{t('sites_all_sites')}</Text>
          {sites.map((site) => (
            <SiteCard key={site.id} site={site} onPress={() => setDetailSiteId(site.id)} />
          ))}
        </View>
          </>
        )}
      </ScrollView>

      <Modal visible={createSiteModalVisible} transparent animationType="slide">
        <View className="flex-1 justify-end bg-black/50">
          <View className="bg-white rounded-t-2xl p-6">
            <Text className="text-lg font-bold mb-4">{t('sites_create_site_modal_title')}</Text>
            <Text className="text-sm text-gray-600 mb-1">{t('sites_site_name')}</Text>
            <TextInput
              value={newSiteName}
              onChangeText={setNewSiteName}
              placeholder={t('sites_name_placeholder')}
              className="border border-gray-300 rounded-lg px-3 py-2 mb-3 bg-white"
            />
            <Text className="text-sm text-gray-600 mb-1">{t('sites_location')}</Text>
            <TextInput
              value={newSiteLocation}
              onChangeText={setNewSiteLocation}
              placeholder={t('sites_location_placeholder')}
              className="border border-gray-300 rounded-lg px-3 py-2 mb-3 bg-white"
            />
            <Text className="text-sm text-gray-600 mb-1">{t('sites_initial_budget_optional')}</Text>
            <TextInput
              value={newSiteBudget}
              onChangeText={setNewSiteBudget}
              placeholder={t('sites_budget_placeholder')}
              keyboardType="number-pad"
              className="border border-gray-300 rounded-lg px-3 py-2 mb-4 bg-white"
            />
            <View className="flex-row gap-3">
              <TouchableOpacity onPress={() => setCreateSiteModalVisible(false)} className="flex-1 py-3 rounded-lg bg-gray-200 items-center">
                <Text className="font-semibold text-gray-700">{t('general_cancel')}</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleConfirmCreateSite} className="flex-1 py-3 rounded-lg bg-blue-600 items-center">
                <Text className="font-semibold text-white">{t('sites_add_site')}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal visible={budgetModalVisible} transparent animationType="slide">
        <View className="flex-1 justify-center bg-black/50 px-4">
          <View className="bg-white rounded-2xl p-6">
            <Text className="text-lg font-bold mb-4">{t('sites_allocate_budget_modal_title')}</Text>
            <Text className="text-sm text-gray-600 mb-2">{t('sites_select_site')}</Text>
            <View className="flex-row flex-wrap gap-2 mb-4">
              {sites.map((s) => (
                <Pressable
                  key={s.id}
                  onPress={() => setAllocateSiteId(s.id)}
                  className={`px-3 py-2 rounded-lg ${allocateSiteId === s.id ? 'bg-blue-600' : 'bg-gray-200'}`}
                >
                  <Text className={allocateSiteId === s.id ? 'text-white font-medium' : 'text-gray-700'}>
                    {s.name}
                  </Text>
                </Pressable>
              ))}
            </View>
            <Text className="text-sm text-gray-600 mb-1">{t('sites_amount_rwf')}</Text>
            <TextInput
              value={amountRwf}
              onChangeText={setAmountRwf}
              placeholder={t('sites_budget_placeholder')}
              keyboardType="number-pad"
              className="border border-gray-300 rounded-lg px-3 py-2 mb-4 bg-white"
            />
            <View className="flex-row gap-3">
              <TouchableOpacity
                onPress={() => setBudgetModalVisible(false)}
                className="flex-1 py-3 rounded-lg bg-gray-200 items-center"
              >
                <Text className="font-semibold text-gray-700">{t('general_cancel')}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleConfirmBudget}
                className="flex-1 py-3 rounded-lg bg-blue-600 items-center"
              >
                <Text className="font-semibold text-white">{t('common_confirm')}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}
