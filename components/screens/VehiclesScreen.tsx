import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Modal,
  TextInput,
  Pressable,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Card } from '@/components/ui/Card';
import { Header } from '@/components/ui/Header';
import { useLocale } from '@/context/LocaleContext';
import { useAuth } from '@/context/AuthContext';
import { useMockAppStore } from '@/context/MockAppStoreContext';
import { useResponsiveTheme } from '@/theme/responsive';
import { generateId } from '@/lib/id';
import type { Vehicle as VehicleType, VehicleType as VType, VehicleStatus } from '@/types';
import { Truck, Cog, Pencil, CheckCircle, Circle } from 'lucide-react-native';

type FilterType = 'all' | 'truck' | 'machine';
type StatusFilter = 'active' | 'all';

const CAN_ADD_VEHICLE_ROLES = ['admin', 'owner', 'head_supervisor'] as const;

export function VehiclesScreen() {
  const { t } = useLocale();
  const { user } = useAuth();
  const theme = useResponsiveTheme();
  const {
    sites,
    vehicles,
    driverVehicleAssignments,
    addVehicle,
    updateVehicle,
    loading,
  } = useMockAppStore();

  const [filter, setFilter] = useState<FilterType>('all');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('active');
  const [addModalVisible, setAddModalVisible] = useState(false);
  const [editVehicle, setEditVehicle] = useState<VehicleType | null>(null);
  const [addType, setAddType] = useState<VType>('truck');
  const [siteId, setSiteId] = useState<string>(sites[0]?.id ?? '');
  const FREE_SITE_KEY = '';
  const [vehicleNumber, setVehicleNumber] = useState('');
  const [mileageKmPerLitre, setMileageKmPerLitre] = useState('');
  const [hoursPerLitre, setHoursPerLitre] = useState('');
  const [capacityTons, setCapacityTons] = useState('');
  const [tankCapacity, setTankCapacity] = useState('');
  const [fuelBalance, setFuelBalance] = useState('');
  const [healthInputs, setHealthInputs] = useState('');
  const [idealConsumptionRange, setIdealConsumptionRange] = useState('');
  const [idealWorkingRange, setIdealWorkingRange] = useState('');
  const [editStatus, setEditStatus] = useState<VehicleStatus>('active');
  /** Machine: display/edit as L/h (litres per hour). Stored as hours_per_litre = 1/Lh. */
  const [machineLh, setMachineLh] = useState('');

  // Allocated = vehicle id appears in any driver assignment for that site (real-time from driver_vehicle_assignments)
  const allocatedBySite = useMemo(() => {
    const map: Record<string, Set<string>> = {};
    for (const a of driverVehicleAssignments) {
      if (!map[a.siteId]) map[a.siteId] = new Set();
      for (const vid of a.vehicleIds ?? []) {
        map[a.siteId].add(vid);
      }
    }
    return map;
  }, [driverVehicleAssignments]);

  const isAllocated = (siteId: string, vehicleId: string) =>
    allocatedBySite[siteId]?.has(vehicleId) ?? false;

  const byStatus =
    statusFilter === 'active'
      ? vehicles.filter((v) => (v.status ?? 'active') === 'active')
      : vehicles;

  const filtered =
    filter === 'all'
      ? byStatus
      : byStatus.filter((v) => v.type === filter);

  const bySite = useMemo(
    () =>
      filtered.reduce<Record<string, VehicleType[]>>((acc, v) => {
        const key = v.siteId ?? FREE_SITE_KEY;
        if (!acc[key]) acc[key] = [];
        acc[key].push(v);
        return acc;
      }, {}),
    [filtered]
  );

  const canAdd = user && CAN_ADD_VEHICLE_ROLES.includes(user.role as (typeof CAN_ADD_VEHICLE_ROLES)[number]);

  const openAdd = (type: VType) => {
    setAddType(type);
    setSiteId(FREE_SITE_KEY);
    setVehicleNumber('');
    setMileageKmPerLitre('');
    setHoursPerLitre('');
    setMachineLh('');
    setCapacityTons('');
    setTankCapacity('');
    setFuelBalance('0');
    setHealthInputs('');
    setIdealConsumptionRange('');
    setIdealWorkingRange('');
    setAddModalVisible(true);
  };

  const openEdit = (v: VehicleType) => {
    setEditVehicle(v);
    setSiteId(v.siteId ?? FREE_SITE_KEY);
    setVehicleNumber(v.vehicleNumberOrId);
    setMileageKmPerLitre(v.mileageKmPerLitre != null ? String(v.mileageKmPerLitre) : '');
    setHoursPerLitre(v.hoursPerLitre != null ? String(v.hoursPerLitre) : '');
    setMachineLh(v.hoursPerLitre != null && v.hoursPerLitre > 0 ? String(1 / v.hoursPerLitre) : '');
    setCapacityTons(v.capacityTons != null ? String(v.capacityTons) : '');
    setTankCapacity(String(v.tankCapacityLitre));
    setFuelBalance(String(v.fuelBalanceLitre));
    setHealthInputs(v.healthInputs ?? '');
    setIdealConsumptionRange(v.idealConsumptionRange ?? '');
    setIdealWorkingRange(v.idealWorkingRange ?? '');
    setEditStatus(v.status ?? 'active');
    setAddType(v.type);
  };

  const closeEdit = () => {
    setEditVehicle(null);
  };

  const submitAdd = async () => {
    const capacity = parseFloat(tankCapacity);
    if (!vehicleNumber.trim() || isNaN(capacity) || capacity <= 0) return;
    const assignedSiteId = siteId === FREE_SITE_KEY ? undefined : siteId;
    try {
      if (addType === 'truck') {
        const mileage = parseFloat(mileageKmPerLitre);
        if (isNaN(mileage) || mileage <= 0) return;
        await addVehicle({
          id: generateId('v'),
          siteId: assignedSiteId,
          type: 'truck',
          vehicleNumberOrId: vehicleNumber.trim(),
          mileageKmPerLitre: mileage,
          capacityTons: capacityTons.trim() ? parseFloat(capacityTons) : undefined,
          tankCapacityLitre: capacity,
          fuelBalanceLitre: 0,
          idealConsumptionRange: idealConsumptionRange.trim() || undefined,
          healthInputs: healthInputs.trim() || undefined,
          status: 'active',
        });
      } else {
        const lh = parseFloat(machineLh || hoursPerLitre);
        if (isNaN(lh) || lh <= 0) return;
        const hours = 1 / lh;
        await addVehicle({
          id: generateId('v'),
          siteId: assignedSiteId,
          type: 'machine',
          vehicleNumberOrId: vehicleNumber.trim(),
          hoursPerLitre: hours,
          tankCapacityLitre: capacity,
          fuelBalanceLitre: 0,
          idealWorkingRange: idealWorkingRange.trim() || undefined,
          status: 'active',
        });
      }
      setAddModalVisible(false);
    } catch {
      Alert.alert(t('alert_error'), t('vehicles_add_failed'));
    }
  };

  const submitEdit = async () => {
    if (!editVehicle) return;
    const capacity = parseFloat(tankCapacity);
    const balance = parseFloat(fuelBalance);
    if (!vehicleNumber.trim() || isNaN(capacity) || capacity <= 0) return;
    if (isNaN(balance) || balance < 0) return;
    const assignedSiteId = siteId === FREE_SITE_KEY ? undefined : siteId;
    try {
      const patch: Partial<VehicleType> = {
        siteId: assignedSiteId,
        vehicleNumberOrId: vehicleNumber.trim(),
        tankCapacityLitre: capacity,
        fuelBalanceLitre: balance,
        idealConsumptionRange: idealConsumptionRange.trim() || undefined,
        healthInputs: healthInputs.trim() || undefined,
        idealWorkingRange: idealWorkingRange.trim() || undefined,
        status: editStatus,
      };
      if (addType === 'truck') {
        const mileage = parseFloat(mileageKmPerLitre);
        if (!isNaN(mileage) && mileage > 0) patch.mileageKmPerLitre = mileage;
        if (capacityTons.trim()) {
          const tons = parseFloat(capacityTons);
          if (!isNaN(tons) && tons >= 0) patch.capacityTons = tons;
        }
      } else {
        const lh = parseFloat(machineLh || hoursPerLitre);
        if (!isNaN(lh) && lh > 0) patch.hoursPerLitre = 1 / lh;
      }
      await updateVehicle(editVehicle.id, patch);
      closeEdit();
    } catch {
      Alert.alert(t('alert_error'), t('vehicles_edit_failed'));
    }
  };

  const getSiteName = (id: string) =>
    id === FREE_SITE_KEY ? t('vehicles_free_no_site') : (sites.find((s) => s.id === id)?.name ?? id);

  return (
    <View className="flex-1 bg-gray-50">
      <Header
        title={t('vehicles_title')}
        subtitle={t('vehicles_subtitle')}
        rightAction={
          canAdd ? (
            <View className="flex-row gap-2">
              <TouchableOpacity
                onPress={() => openAdd('truck')}
                className="bg-blue-600 rounded-lg px-3 py-2 flex-row items-center"
              >
                <Truck size={18} color="#fff" />
                <Text className="text-white font-semibold ml-1">{t('vehicles_add_truck')}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => openAdd('machine')}
                className="bg-gray-700 rounded-lg px-3 py-2 flex-row items-center"
              >
                <Cog size={18} color="#fff" />
                <Text className="text-white font-semibold ml-1">{t('vehicles_add_machine')}</Text>
              </TouchableOpacity>
            </View>
          ) : undefined
        }
      />

      <View className="px-4 py-2 border-b border-gray-200 bg-white">
        <View className="flex-row mb-2">
          {(['all', 'truck', 'machine'] as const).map((f) => (
            <Pressable
              key={f}
              onPress={() => setFilter(f)}
              className={`flex-1 py-2 rounded-lg mx-1 ${filter === f ? 'bg-blue-100' : 'bg-gray-100'}`}
            >
              <Text
                className={`text-center font-medium ${filter === f ? 'text-blue-700' : 'text-gray-600'}`}
              >
                {f === 'all' ? t('vehicles_all') : f === 'truck' ? t('vehicles_trucks') : t('vehicles_machines')}
              </Text>
            </Pressable>
          ))}
        </View>
        <View className="flex-row">
          <Pressable
            onPress={() => setStatusFilter('active')}
            className={`flex-1 py-2 rounded-lg mr-1 ${statusFilter === 'active' ? 'bg-green-100' : 'bg-gray-100'}`}
          >
            <Text className={`text-center text-sm font-medium ${statusFilter === 'active' ? 'text-green-700' : 'text-gray-600'}`}>
              {t('vehicles_status_active')}
            </Text>
          </Pressable>
          <Pressable
            onPress={() => setStatusFilter('all')}
            className={`flex-1 py-2 rounded-lg ${statusFilter === 'all' ? 'bg-gray-200' : 'bg-gray-100'}`}
          >
            <Text className={`text-center text-sm font-medium ${statusFilter === 'all' ? 'text-gray-700' : 'text-gray-600'}`}>
              {t('vehicles_show_inactive')}
            </Text>
          </Pressable>
        </View>
      </View>

      <ScrollView className="flex-1" contentContainerStyle={{ padding: theme.screenPadding }}>
        {loading ? (
          <View className="py-12 items-center">
            <ActivityIndicator size="large" color="#2563eb" />
            <Text className="text-gray-600 mt-3">{t('vehicles_loading')}</Text>
          </View>
        ) : (
          <>
            {Object.entries(bySite).map(([sid, list]) => (
              <View key={sid} className="mb-4">
                <Text className="text-sm font-semibold text-gray-500 mb-2">{getSiteName(sid)}</Text>
                {list.map((v) => {
                  const allocated = isAllocated(sid, v.id);
                  return (
                    <Pressable key={v.id} onPress={() => openEdit(v)}>
                      <Card className="mb-2">
                        <View className="flex-row items-center justify-between">
                          <View className="flex-1">
                            <View className="flex-row items-center gap-2 flex-wrap">
                              <Text className="font-semibold text-gray-900">{v.vehicleNumberOrId}</Text>
                              <View className={`rounded px-2 py-0.5 ${allocated ? 'bg-amber-100' : 'bg-green-100'}`}>
                                <Text className={`text-xs font-medium ${allocated ? 'text-amber-800' : 'text-green-800'}`}>
                                  {allocated ? t('vehicles_allocated') : t('vehicles_free')}
                                </Text>
                              </View>
                              {(v.status ?? 'active') === 'inactive' && (
                                <View className="rounded px-2 py-0.5 bg-gray-200">
                                  <Text className="text-xs font-medium text-gray-600">{t('vehicles_status_inactive')}</Text>
                                </View>
                              )}
                              <Pencil size={14} color="#64748b" />
                            </View>
                            <Text className="text-xs text-gray-500 capitalize">{v.type}</Text>
                          </View>
                          <View className="items-end">
                            <Text className="text-sm text-gray-700">
                              Tank: {v.tankCapacityLitre} L · {t('vehicles_fuel_balance_label')}: {v.fuelBalanceLitre} L
                            </Text>
                            {v.type === 'truck' && v.mileageKmPerLitre != null && (
                              <Text className="text-xs text-gray-500">{v.mileageKmPerLitre} km/L</Text>
                            )}
                            {v.type === 'truck' && v.capacityTons != null && (
                              <Text className="text-xs text-gray-500">{v.capacityTons} t</Text>
                            )}
                            {v.type === 'machine' && v.hoursPerLitre != null && v.hoursPerLitre > 0 && (
                              <Text className="text-xs text-gray-500">{1 / v.hoursPerLitre} L/h</Text>
                            )}
                          </View>
                        </View>
                        {(v.healthInputs || v.idealWorkingRange || v.idealConsumptionRange) && (
                          <View className="mt-2 pt-2 border-t border-gray-100">
                            {v.type === 'truck' && v.healthInputs && (
                              <Text className="text-xs text-gray-600">Health: {v.healthInputs}</Text>
                            )}
                            {v.type === 'truck' && v.idealConsumptionRange && (
                              <Text className="text-xs text-gray-600">Ideal range: {v.idealConsumptionRange}</Text>
                            )}
                            {v.type === 'machine' && v.idealWorkingRange && (
                              <Text className="text-xs text-gray-600">Ideal working range: {v.idealWorkingRange}</Text>
                            )}
                          </View>
                        )}
                      </Card>
                    </Pressable>
                  );
                })}
              </View>
            ))}
            {filtered.length === 0 && (
              <Text className="text-gray-500 text-center py-8">{t('vehicles_no_match')}</Text>
            )}
          </>
        )}
      </ScrollView>

      {/* Add vehicle modal */}
      <Modal visible={addModalVisible} transparent animationType="slide">
        <View className="flex-1 justify-end bg-black/50">
          <View className="bg-white rounded-t-2xl p-6 max-h-[80%]">
            <Text className="text-lg font-bold mb-4">
              {addType === 'truck' ? t('vehicles_add_truck') : t('vehicles_add_machine')}
            </Text>
            <ScrollView>
              <Text className="text-sm text-gray-600 mb-1">{t('vehicles_site_label')} ({t('vehicles_site_optional')})</Text>
              <View className="flex-row flex-wrap gap-2 mb-3">
                <Pressable
                  onPress={() => setSiteId(FREE_SITE_KEY)}
                  className={`px-3 py-2 rounded-lg ${siteId === FREE_SITE_KEY ? 'bg-blue-600' : 'bg-gray-200'}`}
                >
                  <Text className={siteId === FREE_SITE_KEY ? 'text-white font-medium' : 'text-gray-700'}>
                    {t('vehicles_free_no_site')}
                  </Text>
                </Pressable>
                {sites.map((s) => (
                  <Pressable
                    key={s.id}
                    onPress={() => setSiteId(s.id)}
                    className={`px-3 py-2 rounded-lg ${siteId === s.id ? 'bg-blue-600' : 'bg-gray-200'}`}
                  >
                    <Text className={siteId === s.id ? 'text-white font-medium' : 'text-gray-700'}>
                      {s.name}
                    </Text>
                  </Pressable>
                ))}
              </View>
              <Text className="text-sm text-gray-600 mb-1">{t('vehicles_vehicle_number_id')}</Text>
              <TextInput
                value={vehicleNumber}
                onChangeText={setVehicleNumber}
                placeholder={t('vehicles_number_placeholder')}
                className="border border-gray-300 rounded-lg px-3 py-2 mb-3 bg-white"
              />
              {addType === 'truck' ? (
                <>
                  <Text className="text-sm text-gray-600 mb-1">{t('vehicles_mileage_km_litre')}</Text>
                  <TextInput
                    value={mileageKmPerLitre}
                    onChangeText={setMileageKmPerLitre}
                    placeholder={t('vehicles_mileage_placeholder')}
                    keyboardType="decimal-pad"
                    className="border border-gray-300 rounded-lg px-3 py-2 mb-3 bg-white"
                  />
                  <Text className="text-sm text-gray-600 mb-1">{t('vehicles_ideal_consumption_optional')}</Text>
                  <TextInput
                    value={idealConsumptionRange}
                    onChangeText={setIdealConsumptionRange}
                    placeholder={t('vehicles_range_placeholder')}
                    className="border border-gray-300 rounded-lg px-3 py-2 mb-3 bg-white"
                  />
                  <Text className="text-sm text-gray-600 mb-1">{t('vehicles_health_optional')}</Text>
                  <TextInput
                    value={healthInputs}
                    onChangeText={setHealthInputs}
                    placeholder={t('vehicles_health_placeholder')}
                    className="border border-gray-300 rounded-lg px-3 py-2 mb-3 bg-white"
                  />
                </>
              ) : (
                <>
                  <Text className="text-sm text-gray-600 mb-1">{t('vehicles_machine_fuel_label')}</Text>
                  <TextInput
                    value={machineLh}
                    onChangeText={(text) => { setMachineLh(text); const n = parseFloat(text); if (!isNaN(n) && n > 0) setHoursPerLitre(String(1 / n)); }}
                    placeholder="e.g. 5"
                    keyboardType="decimal-pad"
                    className="border border-gray-300 rounded-lg px-3 py-2 mb-3 bg-white"
                  />
                  <Text className="text-sm text-gray-600 mb-1">{t('vehicles_ideal_working_optional')}</Text>
                  <TextInput
                    value={idealWorkingRange}
                    onChangeText={setIdealWorkingRange}
                    placeholder={t('vehicles_hours_range_placeholder')}
                    className="border border-gray-300 rounded-lg px-3 py-2 mb-3 bg-white"
                  />
                </>
              )}
              <Text className="text-sm text-gray-600 mb-1">{t('vehicles_tank_capacity_label')}</Text>
              <TextInput
                value={tankCapacity}
                onChangeText={setTankCapacity}
                placeholder={t('vehicles_tank_placeholder')}
                keyboardType="decimal-pad"
                className="border border-gray-300 rounded-lg px-3 py-2 mb-4 bg-white"
              />
            </ScrollView>
            <View className="flex-row gap-3 mt-2">
              <TouchableOpacity
                onPress={() => setAddModalVisible(false)}
                className="flex-1 py-3 rounded-lg bg-gray-200 items-center"
              >
                <Text className="font-semibold text-gray-700">{t('common_cancel')}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={submitAdd}
                className="flex-1 py-3 rounded-lg bg-blue-600 items-center"
              >
                <Text className="font-semibold text-white">{t('common_add')}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Edit vehicle modal – litres, tank, mileage/hours, status (active/inactive). No hard delete. */}
      <Modal visible={!!editVehicle} transparent animationType="slide">
        <View className="flex-1 justify-end bg-black/50">
          <View className="bg-white rounded-t-2xl p-6 max-h-[85%]">
            <Text className="text-lg font-bold mb-4">{t('vehicles_edit_title')}</Text>
            <ScrollView>
              <Text className="text-sm text-gray-600 mb-1">{t('vehicles_site_label')} ({t('vehicles_site_optional')})</Text>
              <View className="flex-row flex-wrap gap-2 mb-3">
                <Pressable
                  onPress={() => setSiteId(FREE_SITE_KEY)}
                  className={`px-3 py-2 rounded-lg ${siteId === FREE_SITE_KEY ? 'bg-blue-600' : 'bg-gray-200'}`}
                >
                  <Text className={siteId === FREE_SITE_KEY ? 'text-white font-medium' : 'text-gray-700'}>
                    {t('vehicles_free_no_site')}
                  </Text>
                </Pressable>
                {sites.map((s) => (
                  <Pressable
                    key={s.id}
                    onPress={() => setSiteId(s.id)}
                    className={`px-3 py-2 rounded-lg ${siteId === s.id ? 'bg-blue-600' : 'bg-gray-200'}`}
                  >
                    <Text className={siteId === s.id ? 'text-white font-medium' : 'text-gray-700'}>
                      {s.name}
                    </Text>
                  </Pressable>
                ))}
              </View>
              <Text className="text-sm text-gray-600 mb-1">{t('vehicles_vehicle_number_id')}</Text>
              <TextInput
                value={vehicleNumber}
                onChangeText={setVehicleNumber}
                placeholder={t('vehicles_number_placeholder')}
                className="border border-gray-300 rounded-lg px-3 py-2 mb-3 bg-white"
              />
              {addType === 'truck' ? (
                <>
                  <Text className="text-sm text-gray-600 mb-1">{t('vehicles_mileage_km_litre')}</Text>
                  <TextInput
                    value={mileageKmPerLitre}
                    onChangeText={setMileageKmPerLitre}
                    placeholder={t('vehicles_mileage_placeholder')}
                    keyboardType="decimal-pad"
                    className="border border-gray-300 rounded-lg px-3 py-2 mb-3 bg-white"
                  />
                  <Text className="text-sm text-gray-600 mb-1">{t('vehicles_capacity_tons_label')}</Text>
                  <TextInput
                    value={capacityTons}
                    onChangeText={setCapacityTons}
                    placeholder={t('vehicles_capacity_tons_placeholder')}
                    keyboardType="decimal-pad"
                    className="border border-gray-300 rounded-lg px-3 py-2 mb-3 bg-white"
                  />
                  <Text className="text-sm text-gray-600 mb-1">{t('vehicles_ideal_consumption_optional')}</Text>
                  <TextInput
                    value={idealConsumptionRange}
                    onChangeText={setIdealConsumptionRange}
                    placeholder={t('vehicles_range_placeholder')}
                    className="border border-gray-300 rounded-lg px-3 py-2 mb-3 bg-white"
                  />
                  <Text className="text-sm text-gray-600 mb-1">{t('vehicles_health_optional')}</Text>
                  <TextInput
                    value={healthInputs}
                    onChangeText={setHealthInputs}
                    placeholder={t('vehicles_health_placeholder')}
                    className="border border-gray-300 rounded-lg px-3 py-2 mb-3 bg-white"
                  />
                </>
              ) : (
                <>
                  <Text className="text-sm text-gray-600 mb-1">{t('vehicles_machine_fuel_label')}</Text>
                  <TextInput
                    value={machineLh}
                    onChangeText={(text) => { setMachineLh(text); const n = parseFloat(text); if (!isNaN(n) && n > 0) setHoursPerLitre(String(1 / n)); }}
                    placeholder="e.g. 5"
                    keyboardType="decimal-pad"
                    className="border border-gray-300 rounded-lg px-3 py-2 mb-3 bg-white"
                  />
                  <Text className="text-sm text-gray-600 mb-1">{t('vehicles_ideal_working_optional')}</Text>
                  <TextInput
                    value={idealWorkingRange}
                    onChangeText={setIdealWorkingRange}
                    placeholder={t('vehicles_hours_range_placeholder')}
                    className="border border-gray-300 rounded-lg px-3 py-2 mb-3 bg-white"
                  />
                </>
              )}
              <Text className="text-sm text-gray-600 mb-1">{t('vehicles_tank_capacity_label')}</Text>
              <TextInput
                value={tankCapacity}
                onChangeText={setTankCapacity}
                placeholder={t('vehicles_tank_placeholder')}
                keyboardType="decimal-pad"
                className="border border-gray-300 rounded-lg px-3 py-2 mb-3 bg-white"
              />
              <Text className="text-sm text-gray-600 mb-1">{t('vehicles_fuel_balance_label')}</Text>
              <TextInput
                value={fuelBalance}
                onChangeText={setFuelBalance}
                placeholder="0"
                keyboardType="decimal-pad"
                className="border border-gray-300 rounded-lg px-3 py-2 mb-3 bg-white"
              />
              <Text className="text-sm text-gray-600 mb-2">{t('vehicles_status_label')}</Text>
              <View className="flex-row gap-2 mb-4">
                <Pressable
                  onPress={() => setEditStatus('active')}
                  className={`flex-1 flex-row items-center justify-center py-3 rounded-lg border ${editStatus === 'active' ? 'bg-green-100 border-green-500' : 'bg-gray-50 border-gray-200'}`}
                >
                  <CheckCircle size={20} color={editStatus === 'active' ? '#059669' : '#94a3b8'} />
                  <Text className={`ml-2 font-medium ${editStatus === 'active' ? 'text-green-700' : 'text-gray-600'}`}>
                    {t('vehicles_status_active')}
                  </Text>
                </Pressable>
                <Pressable
                  onPress={() => setEditStatus('inactive')}
                  className={`flex-1 flex-row items-center justify-center py-3 rounded-lg border ${editStatus === 'inactive' ? 'bg-gray-200 border-gray-500' : 'bg-gray-50 border-gray-200'}`}
                >
                  <Circle size={20} color={editStatus === 'inactive' ? '#475569' : '#94a3b8'} />
                  <Text className={`ml-2 font-medium ${editStatus === 'inactive' ? 'text-gray-700' : 'text-gray-600'}`}>
                    {t('vehicles_status_inactive')}
                  </Text>
                </Pressable>
              </View>
            </ScrollView>
            <View className="flex-row gap-3 mt-2">
              <TouchableOpacity
                onPress={closeEdit}
                className="flex-1 py-3 rounded-lg bg-gray-200 items-center"
              >
                <Text className="font-semibold text-gray-700">{t('common_cancel')}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={submitEdit}
                className="flex-1 py-3 rounded-lg bg-blue-600 items-center"
              >
                <Text className="font-semibold text-white">{t('common_save')}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}
