import React, { useState, useEffect, use } from "react";
import { useUser } from "../../context/UserContext";
import { Table, Button, message } from "antd";
import type { ColumnsType } from "antd/es/table";
import * as IndustryService from "../../api/supabase/industryService";
import { Industry } from "../../api/supabase/industryService";
import { getDatasetsApi, Dataset } from "../../api/dify";
import { EditOutlined, DeleteOutlined, PlusOutlined } from "@ant-design/icons";

interface IndustryManagementProps {
  externalDatasets?: Dataset[];
  externalDatasetsLoading?: boolean;
  externalIndustries?: Industry[];
  externalIndustriesLoading?: boolean;
  externalIndustriesError?: string | null;
  externalRefetchIndustries?: () => Promise<void>;
}

const UpdateIndustryManagement: React.FC<IndustryManagementProps> = ({
  externalDatasets,
  externalDatasetsLoading,
  externalIndustries,
  externalIndustriesLoading,
  externalIndustriesError,
  externalRefetchIndustries,
}) => {
  const [industries, setIndustries] = useState<Industry[]>([]);
  const [filteredIndustries, setFilteredIndustries] = useState<Industry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  // 分页相关状态
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const itemsPerPage = 6;

  // 行业编辑相关状态
  const [selectedIndustry, setSelectedIndustry] = useState<Industry | null>(null);
  const [editModeActive, setEditModeActive] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [createMode, setCreateMode] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [industryToDelete, setIndustryToDelete] = useState<Industry | null>(null);

  // 素材管理相关状态
  const [materialInput, setMaterialInput] = useState("");
  const [appIdInput, setAppIdInput] = useState("");
  const [saveLoading, setSaveLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // 素材库数据
  const [datasets, setDatasets] = useState<Dataset[]>([]);
  const [datasetsLoading, setDatasetsLoading] = useState(false);

  // 编辑表单状态
  const [formData, setFormData] = useState<{
    name: string;
    description: string;
    nickname: string;
    material_list: string[];
    app_id: string;
  }>({
    name: "",
    description: "",
    nickname: "",
    material_list: [],
    app_id: "",
  });
  const [isHovered, setIsHovered] = useState(false);
  // 搜索功能
  useEffect(() => {
    if (!industries.length) return;

    const results = industries.filter(
      (industry) =>
        industry.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (industry.app_id && industry.app_id.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    setFilteredIndustries(results);
    setTotalPages(Math.ceil(results.length / itemsPerPage));
    setCurrentPage(1); // 重置到第一页
  }, [searchTerm, industries]);

  // 获取当前页的行业
  const getCurrentPageIndustries = () => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredIndustries.slice(startIndex, startIndex + itemsPerPage);
  };

  // 分页导航
  const goToPage = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  // 页面加载时获取行业列表和素材库数据
  useEffect(() => {
    // 加载素材库数据（如果没有提供外部数据集）
    if (!externalDatasets) {
      fetchDatasets();
    }

    // 如果无外部行业数据，则自行获取
    if (!externalIndustries) {
      fetchLocalIndustries();
    }
  }, [externalDatasets, externalIndustries]);

  // 使用外部行业数据（如果提供）
  useEffect(() => {
    if (externalIndustries) {
      setIndustries(externalIndustries);
      setFilteredIndustries(externalIndustries);
      setTotalPages(Math.ceil(externalIndustries.length / itemsPerPage));
      setError(externalIndustriesError || null);
    }
  }, [externalIndustries, externalIndustriesError]);

  // 同步加载状态
  useEffect(() => {
    if (externalIndustriesLoading !== undefined) {
      setLoading(externalIndustriesLoading);
    }
  }, [externalIndustriesLoading]);

  // 获取素材库列表（如果没有提供外部数据集）
  const fetchDatasets = async () => {
    if (externalDatasets) return; // 如果提供了外部数据集，则不需要获取

    try {
      setDatasetsLoading(true);
      const response = await getDatasetsApi({});
      if (response && response.data) {
        setDatasets(response.data);
      }
    } catch (err) {
      console.error("获取素材库列表失败:", err);
    } finally {
      setDatasetsLoading(false);
    }
  };

  // 使用外部数据集（如果提供）
  useEffect(() => {
    if (externalDatasets) {
      setDatasets(externalDatasets);
    }
  }, [externalDatasets]);

  // 使用外部数据集加载状态（如果提供）
  useEffect(() => {
    if (externalDatasetsLoading !== undefined) {
      setDatasetsLoading(externalDatasetsLoading);
    }
  }, [externalDatasetsLoading]);

  // 获取行业列表（本地获取，当父组件未提供时使用）
  const fetchLocalIndustries = async () => {
    try {
      setLoading(true);
      const industriesData = await IndustryService.getAllIndustries();

      if (industriesData && industriesData.length > 0) {
        // 按名称排序
        const sortedIndustries = industriesData.sort((a, b) =>
          a.name.localeCompare(b.name, "zh-CN")
        );

        setIndustries(sortedIndustries);
        setFilteredIndustries(sortedIndustries);
        setTotalPages(Math.ceil(sortedIndustries.length / itemsPerPage));
        setError(null);
      } else {
        setIndustries([]);
        setFilteredIndustries([]);
        setTotalPages(0);
        setError("暂无行业数据");
      }
    } catch (err: any) {
      console.error("获取行业列表失败:", err);
      setError(err.message || "获取行业列表失败");
      setIndustries([]);
      setFilteredIndustries([]);
    } finally {
      setLoading(false);
    }
  };

  // 刷新行业列表（优先使用父组件提供的刷新函数）
  const fetchIndustries = async () => {
    // 如果有外部刷新函数，使用它
    if (externalRefetchIndustries) {
      await externalRefetchIndustries();
      return;
    }

    // 否则自行刷新
    await fetchLocalIndustries();
  };

  // 创建新行业
  const handleCreateIndustry = () => {
    setSelectedIndustry(null);
    setFormData({
      name: "",
      description: "",
      nickname: "",
      material_list: [],
      app_id: "",
    });
    setCreateMode(true);
    setEditModeActive(true);
    setFormError(null);
  };

  // 编辑行业
  const handleEditIndustry = (industry: Industry) => {
    setSelectedIndustry(industry);
    setFormData({
      name: industry.name,
      description: industry.description || "",
      nickname: industry.nickname || "",
      material_list: industry.material_list || [],
      app_id: industry.app_id || "",
    });
    setCreateMode(false);
    setEditModeActive(true);
    setFormError(null);
  };

  // 取消编辑
  const handleCancelEdit = () => {
    setEditModeActive(false);
    setSelectedIndustry(null);
    setCreateMode(false);
    setFormError(null);
  };

  // 表单字段变更处理
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  // 添加素材ID
  const handleAddMaterial = () => {
    if (!materialInput.trim()) return;

    // 确保不添加重复的素材ID
    if (!formData.material_list.includes(materialInput)) {
      setFormData({
        ...formData,
        material_list: [...formData.material_list, materialInput],
      });
    }

    setMaterialInput("");
  };

  // 移除素材ID
  const handleRemoveMaterial = (materialId: string) => {
    setFormData({
      ...formData,
      material_list: formData.material_list.filter((id) => id !== materialId),
    });
  };

  // 保存行业表单
  const handleSaveIndustry = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      setFormError("行业名称不能为空");
      return;
    }

    setSaveLoading(true);
    setFormError(null);

    try {
      let updatedIndustry: Industry;

      if (createMode) {
        // 创建新行业
        updatedIndustry = await IndustryService.createIndustry(
          formData.name,
          formData.material_list,
          formData.app_id || undefined,
          formData.description || undefined,
          formData.nickname || undefined
        );

        // 更新行业列表
        setIndustries((prevIndustries) => {
          const newIndustries = [...prevIndustries, updatedIndustry];
          return newIndustries.sort((a, b) => a.name.localeCompare(b.name, "zh-CN"));
        });
      } else if (selectedIndustry) {
        // 更新现有行业
        updatedIndustry = await IndustryService.updateIndustry(selectedIndustry.id, {
          name: formData.name,
          material_list: formData.material_list,
          app_id: formData.app_id || null,
        });

        // 更新行业列表
        setIndustries((prevIndustries) => {
          const updatedIndustries = prevIndustries.map((industry) =>
            industry.id === updatedIndustry.id ? updatedIndustry : industry
          );
          return updatedIndustries.sort((a, b) => a.name.localeCompare(b.name, "zh-CN"));
        });
      }

      // 更新过滤后的行业列表
      setFilteredIndustries((prevFiltered) => {
        const updatedFiltered = searchTerm
          ? industries.filter(
              (industry) =>
                industry.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                (industry.app_id &&
                  industry.app_id.toLowerCase().includes(searchTerm.toLowerCase()))
            )
          : industries;
        return updatedFiltered;
      });

      // 显示成功提示
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);

      // 退出编辑模式
      setEditModeActive(false);
      setSelectedIndustry(null);
      setCreateMode(false);
    } catch (err: any) {
      console.error("保存行业失败:", err);
      setFormError(err.message || "保存行业信息失败");
    } finally {
      setSaveLoading(false);
    }
  };

  // 准备删除行业（显示确认对话框）
  const prepareDeleteIndustry = (industry: Industry) => {
    setIndustryToDelete(industry);
    setShowDeleteConfirm(true);
  };

  // 确认删除行业
  const confirmDeleteIndustry = async () => {
    if (!industryToDelete) return;

    try {
      setLoading(true);
      await IndustryService.deleteIndustry(industryToDelete.id);

      // 更新行业列表
      setIndustries((prevIndustries) => prevIndustries.filter((i) => i.id !== industryToDelete.id));

      // 更新过滤后的行业列表
      setFilteredIndustries((prevFiltered) =>
        prevFiltered.filter((i) => i.id !== industryToDelete.id)
      );

      setError(null);
    } catch (err: any) {
      console.error("删除行业失败:", err);
      setError(err.message || "删除行业失败");
    } finally {
      setLoading(false);
      setShowDeleteConfirm(false);
      setIndustryToDelete(null);
    }
  };

  // 取消删除行业
  const cancelDeleteIndustry = () => {
    setShowDeleteConfirm(false);
    setIndustryToDelete(null);
  };

  // 渲染分页控件
  const renderPagination = () => {
    if (totalPages <= 1) return null;

    return (
      <div className="flex justify-center mt-4">
        <nav className="inline-flex rounded-md shadow">
          <button
            onClick={() => goToPage(currentPage - 1)}
            disabled={currentPage === 1}
            className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
          >
            上一页
          </button>

          {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
            <button
              key={page}
              onClick={() => goToPage(page)}
              className={`relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium ${
                currentPage === page
                  ? "bg-primary bg-opacity-10 text-primary"
                  : "text-gray-700 hover:bg-gray-50"
              }`}
            >
              {page}
            </button>
          ))}

          <button
            onClick={() => goToPage(currentPage + 1)}
            disabled={currentPage === totalPages}
            className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
          >
            下一页
          </button>
        </nav>
      </div>
    );
  };
  //表格列组件
  const columns: ColumnsType<Industry> = [
    {
      title: "行业名称",
      key: "name",
      render: (_, industry) => {
        return (
          <div className="flex items-center">
            <div className="text-sm font-medium text-purple-300">{industry.name}</div>
          </div>
        );
      },
    },
    {
      title: "应用ID",
      key: "ApplicationID",
      render: (_, industry) => {
        return (
          <div className="flex items-center">
            <div className="text-sm font-medium text-gray-900">{industry.app_id}</div>
          </div>
        );
      },
    },
    {
      title: "素材数量",
      key: "QuantityMaterialse",
      render: (_, industry) => {
        return (
          <div className="flex items-center">
            <div className="text-sm font-medium text-gray-900">{industry.material_list.length}</div>
          </div>
        );
      },
    },
    {
      title: "创建时间",
      key: "time",
      render: (_, industry) => {
        return (
          <div className="flex items-center">
            <div className="text-sm font-medium text-gray-900">
              {new Date(industry.created_at).toLocaleString()}
            </div>
          </div>
        );
      },
    },
    {
      title: "操作",
      key: "  operation",
      render: (_, user) => (
        <>
          <Button
            type="text"
            style={{ color: "#D477E1" }}
            icon={<EditOutlined />}
            onClick={() => handleEditIndustry(user)}
          />
          <Button
            type="text"
            danger
            icon={<DeleteOutlined />}
            onClick={() => prepareDeleteIndustry(user)}
          />
        </>
      ),
    },
  ];
  return (
    <div>
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {saveSuccess && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded mb-4 fixed top-4 right-4 z-50 shadow-md">
          行业信息已成功保存
        </div>
      )}

      <div className="mb-4 flex items-center bg-white py-2 px-2">
        <div className="text-lg text-gray-900">搜索行业 :</div>
        <div className="relative flex-1 ml-[10px]">
          <input
            type="text"
            placeholder="搜索行业（名称或应用ID）"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary pl-10"
          />
          <div className="absolute left-3 top-2.5 text-gray-400">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </div>
        </div>
      </div>

      <div className="flex flex-col md:flex-row min-h-0 space-y-4 md:space-y-0 md:space-x-6">
        {/* 行业列表部分 */}
        <div
          className={`bg-white  shadow-md overflow-hidden ${
            editModeActive ? "md:w-3/5" : "w-full"
          }`}
        >
          <div className="flex items-center justify-between p-4 pr-6">
            <div className="text-lg -bold text-gray-900">行业管理</div>
            <div className="flex space-x-2">
              <Button
                onClick={fetchIndustries}
                disabled={loading}
                style={{ border: "1px solid #D477E1", color: "#D477E1", borderRadius: "2px" }}
              >
                {loading ? "刷新中..." : "刷新"}
              </Button>
              <Button
                onClick={handleCreateIndustry}
                disabled={loading}
                type="primary"
                style={{
                  borderRadius: "2px",
                  background: "linear-gradient(to right, #8389FC, #D477E1)",
                  textAlign: "center",
                  transition: "all 0.3s ease-in-out",
                  transform: isHovered ? "scale(1.05)" : "scale(1)",
                  transformOrigin: "center",
                }}
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => {
                  setIsHovered(false);
                }}
                icon={<PlusOutlined />}
              >
                新建行业
              </Button>
            </div>
          </div>
          {loading ? (
            <div className="p-6 flex justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
            </div>
          ) : filteredIndustries.length === 0 ? (
            <div className="p-6 text-center text-gray-500">
              {searchTerm ? "没有找到匹配的行业" : "暂无行业数据"}
            </div>
          ) : (
            <Table
              rowKey="id"
              columns={columns}
              dataSource={filteredIndustries}
              scroll={{ x: true }}
              pagination={{
                pageSize: itemsPerPage,
                current: currentPage,
                total: filteredIndustries.length,
                onChange: (page) => setCurrentPage(page),
                showSizeChanger: false,
              }}
            />
          )}

          {renderPagination()}
        </div>

        {/* 行业编辑表单 */}
        {editModeActive && (
          <div className="w-full md:w-2/5 bg-white rounded-lg shadow-md p-4 md:p-6 max-h-[70vh] md:max-h-[70vh] overflow-y-auto">
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              {createMode ? "创建新行业" : "编辑行业"}
            </h2>

            {formError && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
                {formError}
              </div>
            )}

            <form onSubmit={handleSaveIndustry}>
              <div className="mb-4">
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                  行业名称 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
                />
              </div>

              <div className="mb-4">
                <label htmlFor="nickname" className="block text-sm font-medium text-gray-700 mb-1">
                  行业简称
                </label>
                <input
                  type="text"
                  id="nickname"
                  name="nickname"
                  value={formData.nickname}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
                />
              </div>

              <div className="mb-4">
                <label
                  htmlFor="description"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  行业描述
                </label>
                <textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
                ></textarea>
              </div>

              <div className="mb-4">
                <label htmlFor="app_id" className="block text-sm font-medium text-gray-700 mb-1">
                  应用ID
                </label>
                <input
                  type="text"
                  id="app_id"
                  name="app_id"
                  value={formData.app_id}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
                />
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">可访问素材库</label>
                <div className="mb-3">
                  <label className="block text-sm font-medium text-gray-700 mb-1">选择素材库</label>
                  <div className="bg-gray-50 p-3 rounded-md border border-gray-300 max-h-60 overflow-y-auto">
                    {datasetsLoading ? (
                      <div className="text-center py-2">加载中...</div>
                    ) : datasets.length === 0 ? (
                      <div className="text-center py-2">暂无可用素材库</div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        {datasets.map((dataset) => {
                          const isSelected = formData.material_list.includes(dataset.id);
                          return (
                            <div
                              key={dataset.id}
                              className={`p-2 rounded-md cursor-pointer border flex items-center ${
                                isSelected
                                  ? "bg-blue-50 border-blue-300"
                                  : "bg-white border-gray-200 hover:bg-gray-50"
                              }`}
                              onClick={() => {
                                // 如果已选中，则移除
                                if (isSelected) {
                                  handleRemoveMaterial(dataset.id);
                                } else {
                                  // 否则添加到选中列表
                                  setFormData({
                                    ...formData,
                                    material_list: [...formData.material_list, dataset.id],
                                  });
                                }
                              }}
                            >
                              <div
                                className={`w-5 h-5 rounded border mr-2 flex-shrink-0 ${
                                  isSelected ? "bg-blue-500 border-blue-500" : "border-gray-300"
                                }`}
                              >
                                {isSelected && (
                                  <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    className="h-5 w-5 text-white"
                                    viewBox="0 0 20 20"
                                    fill="currentColor"
                                  >
                                    <path
                                      fillRule="evenodd"
                                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                      clipRule="evenodd"
                                    />
                                  </svg>
                                )}
                              </div>
                              <div className="flex-grow">
                                <div className="font-medium">{dataset.name}</div>
                                <div className="text-xs text-gray-500">{dataset.id}</div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>

                <div className="mt-4">
                  <div className="flex justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700">
                      已选素材库 ({formData.material_list.length})
                    </span>
                  </div>
                  {formData.material_list.length > 0 ? (
                    <div className="border border-gray-200 rounded-md p-2 max-h-40 overflow-y-auto">
                      {formData.material_list.map((materialId, index) => {
                        const dataset = datasets.find((d) => d.id === materialId);
                        return (
                          <div
                            key={index}
                            className="flex items-center justify-between bg-gray-50 px-3 py-2 rounded mb-1"
                          >
                            <span className="text-sm text-gray-700 truncate flex-1">
                              {dataset ? dataset.name : materialId}
                              <span className="text-xs text-gray-500 ml-2">{materialId}</span>
                            </span>
                            <button
                              type="button"
                              onClick={() => handleRemoveMaterial(materialId)}
                              className="ml-2 text-red-500 hover:text-red-700"
                            >
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                className="h-4 w-4"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M6 18L18 6M6 6l12 12"
                                />
                              </svg>
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="text-sm text-gray-500 mt-1">暂无已选素材库</div>
                  )}
                </div>
              </div>

              <div className="flex justify-end space-x-3 mt-6">
                <button
                  type="button"
                  onClick={handleCancelEdit}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-opacity-50"
                >
                  取消
                </button>
                <button
                  type="submit"
                  disabled={saveLoading}
                  className="px-4 py-2 bg-primary text-white rounded-md shadow hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-primary focus:ring-opacity-50 disabled:opacity-50"
                >
                  {saveLoading ? "保存中..." : "保存"}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>

      {/* 删除确认对话框 */}
      {showDeleteConfirm && industryToDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md mx-auto">
            <h3 className="text-lg font-medium text-gray-900 mb-4">确认删除</h3>
            <p className="text-gray-600 mb-6">
              确定要删除行业"{industryToDelete.name}"吗？此操作不可撤销。
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={cancelDeleteIndustry}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 bg-white hover:bg-gray-50"
              >
                取消
              </button>
              <button
                onClick={confirmDeleteIndustry}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
              >
                确认删除
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UpdateIndustryManagement;
