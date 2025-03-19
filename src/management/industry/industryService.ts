import supabase from '../../auth/supabaseConfig';

// 定义行业数据接口
export interface Industry {
  id: string;
  name: string;
  material_list: string[];
  app_id: string | null;
  created_at: string;
  updated_at: string;
}

// 获取所有行业
export const getAllIndustries = async (): Promise<Industry[]> => {
  try {
    const { data, error } = await supabase
      .from('industry')
      .select('*')
      .order('name');
    
    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('获取行业列表失败:', error);
    throw error;
  }
};

// 根据ID获取行业
export const getIndustryById = async (id: string): Promise<Industry | null> => {
  try {
    const { data, error } = await supabase
      .from('industry')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) {
      if (error.code === 'PGRST116') { // 没有找到记录
        return null;
      }
      throw error;
    }
    
    return data;
  } catch (error) {
    console.error(`获取行业(ID: ${id})失败:`, error);
    throw error;
  }
};

// 根据名称获取行业
export const getIndustryByName = async (name: string): Promise<Industry | null> => {
  try {
    const { data, error } = await supabase
      .from('industry')
      .select('*')
      .eq('name', name)
      .single();
    
    if (error) {
      if (error.code === 'PGRST116') { // 没有找到记录
        return null;
      }
      throw error;
    }
    
    return data;
  } catch (error) {
    console.error(`获取行业(名称: ${name})失败:`, error);
    throw error;
  }
};

// 创建新行业
export const createIndustry = async (
  name: string, 
  materialList: string[] = [], 
  appId?: string
): Promise<Industry> => {
  try {
    const { data, error } = await supabase
      .from('industry')
      .insert([
        { 
          name, 
          material_list: materialList,
          app_id: appId || null
        }
      ])
      .select()
      .single();
    
    if (error) throw error;
    return data;
  } catch (error) {
    console.error('创建行业失败:', error);
    throw error;
  }
};

// 更新行业信息
export const updateIndustry = async (
  id: string,
  updates: Partial<Omit<Industry, 'id' | 'created_at' | 'updated_at'>>
): Promise<Industry> => {
  try {
    const { data, error } = await supabase
      .from('industry')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  } catch (error) {
    console.error(`更新行业(ID: ${id})失败:`, error);
    throw error;
  }
};

// 删除行业
export const deleteIndustry = async (id: string): Promise<void> => {
  try {
    const { error } = await supabase
      .from('industry')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  } catch (error) {
    console.error(`删除行业(ID: ${id})失败:`, error);
    throw error;
  }
};

// 添加素材到行业
export const addMaterialToIndustry = async (industryId: string, materialId: string): Promise<Industry> => {
  try {
    // 先获取当前行业数据
    const industry = await getIndustryById(industryId);
    if (!industry) {
      throw new Error(`行业不存在: ${industryId}`);
    }
    
    // 检查素材是否已存在于列表中
    if (industry.material_list.includes(materialId)) {
      return industry; // 素材已存在，直接返回当前行业数据
    }
    
    // 添加新素材ID到列表
    const updatedMaterialList = [...industry.material_list, materialId];
    
    // 更新行业数据
    const { data, error } = await supabase
      .from('industry')
      .update({ material_list: updatedMaterialList })
      .eq('id', industryId)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  } catch (error) {
    console.error(`向行业(ID: ${industryId})添加素材失败:`, error);
    throw error;
  }
};

// 从行业中移除素材
export const removeMaterialFromIndustry = async (industryId: string, materialId: string): Promise<Industry> => {
  try {
    // 先获取当前行业数据
    const industry = await getIndustryById(industryId);
    if (!industry) {
      throw new Error(`行业不存在: ${industryId}`);
    }
    
    // 过滤掉要移除的素材ID
    const updatedMaterialList = industry.material_list.filter(id => id !== materialId);
    
    // 更新行业数据
    const { data, error } = await supabase
      .from('industry')
      .update({ material_list: updatedMaterialList })
      .eq('id', industryId)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  } catch (error) {
    console.error(`从行业(ID: ${industryId})移除素材失败:`, error);
    throw error;
  }
};

// 设置行业的机器人应用ID
export const setIndustryAppId = async (industryId: string, appId: string): Promise<Industry> => {
  try {
    const { data, error } = await supabase
      .from('industry')
      .update({ app_id: appId })
      .eq('id', industryId)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  } catch (error) {
    console.error(`设置行业(ID: ${industryId})的应用ID失败:`, error);
    throw error;
  }
};

// 获取用户所属行业
export const getUserIndustry = async (userId: string): Promise<string | null> => {
  try {
    const { data, error } = await supabase
      .from('user_profiles')
      .select('industry')
      .eq('user_id', userId)
      .single();
    
    if (error) {
      if (error.code === 'PGRST116') { // 没有找到记录
        return null;
      }
      throw error;
    }
    
    return data.industry;
  } catch (error) {
    console.error(`获取用户(ID: ${userId})的行业失败:`, error);
    throw error;
  }
};

// 设置用户所属行业
export const setUserIndustry = async (userId: string, industry: string): Promise<void> => {
  try {
    const { error } = await supabase
      .from('user_profiles')
      .update({ industry })
      .eq('user_id', userId);
    
    if (error) throw error;
  } catch (error) {
    console.error(`设置用户(ID: ${userId})的行业失败:`, error);
    throw error;
  }
};

// 获取行业可访问的素材列表
export const getIndustryMaterials = async (industryId: string): Promise<string[]> => {
  try {
    const industry = await getIndustryById(industryId);
    if (!industry) {
      throw new Error(`行业不存在: ${industryId}`);
    }
    
    return industry.material_list;
  } catch (error) {
    console.error(`获取行业(ID: ${industryId})的素材列表失败:`, error);
    throw error;
  }
};

// 检查素材是否属于指定行业
export const isMaterialInIndustry = async (industryId: string, materialId: string): Promise<boolean> => {
  try {
    const industry = await getIndustryById(industryId);
    if (!industry) {
      return false;
    }
    
    return industry.material_list.includes(materialId);
  } catch (error) {
    console.error(`检查素材是否属于行业失败:`, error);
    return false;
  }
};
