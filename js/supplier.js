new Vue({
    el: '#app',
    data() {
        return {
            activeIndex: '5-1',
            searchKeyword: '',
            tableData: [],
            loading: false,
            userId: 1,
            userRole: 1,
            pageNum: 1,
            pageSize: 10,
            sortField: 'created_at',
            sortOrder: 'desc',
            count: 0,
            baseURL: 'http://127.0.0.1:8081',

            // 新增弹窗相关
            addSupplierDialog: false,
            // 移除 supplierManagementId 字段，因为它是自增的
            newSupplier: {
                supplierId: '',
                partId: '',
                supplyQuantity: null
            },
            // 移除 supplierManagementId 的验证规则
            addSupplierRules: {
                supplierId: [
                    {required: true, message: '请输入供应商编号', trigger: 'blur'}
                ],
                partId: [
                    {required: true, message: '请输入配件编号', trigger: 'blur'}
                ],
                supplyQuantity: [
                    {required: true, message: '请输入供应数量', trigger: 'blur'},
                    {
                        validator: (rule, value, callback) => {
                            if (value === '' || value === null) {
                                callback(new Error('请输入供应数量'));
                            } else if (Number(value) <= 0 || !Number.isInteger(Number(value))) {
                                callback(new Error('供应数量需为正整数'));
                            } else {
                                callback();
                            }
                        },
                        trigger: 'blur'
                    }
                ]
            },

            // 修改弹窗相关
            updateSupplierDialog: false,
            currentSupplier: {},
            updateSupplierRules: {
                supplierId: [
                    {required: true, message: '请输入供应商编号', trigger: 'blur'}
                ],
                partId: [
                    {required: true, message: '请输入配件编号', trigger: 'blur'}
                ],
                supplyQuantity: [
                    {required: true, message: '请输入供应数量', trigger: 'blur'},
                    {
                        validator: (rule, value, callback) => {
                            if (value === '' || value === null) {
                                callback(new Error('请输入供应数量'));
                            } else if (Number(value) <= 0 || !Number.isInteger(Number(value))) {
                                callback(new Error('供应数量需为正整数'));
                            } else {
                                callback();
                            }
                        },
                        trigger: 'blur'
                    }
                ]
            }
        };
    },
    created() {
        this.getUserInfoFromCookie();
        this.fetchTableData();
    },
    methods: {
        getUserInfoFromCookie() {
            const userInfoEncoded = Cookies.get('userInfo');
            if (userInfoEncoded) {
                const userInfo = JSON.parse(decodeURIComponent(userInfoEncoded));
                this.userId = userInfo.userId || 1;
                this.userRole = userInfo.userRole || 1;
            } else {
                this.$alert('未检测到登录状态，将跳转至登录页', '登录失效', {
                    confirmButtonText: '确定',
                    callback: () => window.location.href = '/page/login.html'
                });
            }
        },

        updateSearch(value) {
            this.searchKeyword = value;
        },
        filterTable() {
            this.pageNum = 1;
            this.fetchTableData();
        },

        fetchTableData() {
            this.loading = true;
            axios.get(`${this.baseURL}/yjx/supplier/getAllSupplierManagement`, {
                params: {
                    userId: this.userId,
                    searchKeyword: this.searchKeyword,
                    pageNum: this.pageNum,
                    pageSize: this.pageSize,
                    sortField: this.sortField,
                    sortOrder: this.sortOrder
                }
            })
                .then(response => {
                    if (response.data.code === 200) {
                        const resData = response.data.data || {};
                        if (!resData.supplierManagementList) {
                            this.$message.error('数据格式错误，请联系开发人员');
                            return;
                        }
                        this.tableData = resData.supplierManagementList.map(item => ({
                            supplierManagementId: item.supplierManagementId || '',
                            supplierName: item.supplierName || '',
                            supplierId: item.supplierId || '',
                            partId: item.partId || '',
                            partName: item.partName || '',
                            supplyQuantity: item.supplyQuantity || 0,
                            createdAt: item.createdAt || ''
                        }));
                        this.count = resData.count || 0;
                    } else {
                        this.$message.error(`获取数据失败：${response.data.msg || '未知错误'}`);
                    }
                })
                .catch(() => {
                    this.$message.error('获取数据失败，请稍后再试');
                })
                .finally(() => {
                    this.loading = false;
                });
        },

        viewSupplierDetails(supplier) {
            this.$alert(
                `<h3>供应记录详情</h3>
        <p>供应商管理编号：${supplier.supplierManagementId}</p>
        <p>供应商名称：${supplier.supplierName}</p>
        <p>供应商编号：${supplier.supplierId}</p>
        <p>配件编号：${supplier.partId}</p>
        <p>配件名称：${supplier.partName}</p>
        <p>供应数量：${supplier.supplyQuantity}</p>
        <p>创建时间：${supplier.createdAt}</p>`,
                '详情',
                {
                    dangerouslyUseHTMLString: true,
                    confirmButtonText: '确定',
                    width: '400px'
                }
            );
        },

        addSupplier() {
            this.$refs.addSupplierForm && this.$refs.addSupplierForm.resetFields();
            // 只需要初始化可填写的字段
            this.newSupplier = {
                supplierId: '',
                partId: '',
                supplyQuantity: null
            };
            this.addSupplierDialog = true;
        },
        submitNewSupplier() {
            this.$refs.addSupplierForm.validate((isValid) => {
                if (isValid) {
                    const dataToSubmit = {
                        ...this.newSupplier,
                        supplyQuantity: Number(this.newSupplier.supplyQuantity)
                    };
                    axios.post(`${this.baseURL}/yjx/supplier/createSupplierManagement`, dataToSubmit)
                        .then(response => {
                            if (response.data.code === 200) {
                                this.$message.success('新增供应记录成功！');
                                this.addSupplierDialog = false;
                                this.fetchTableData();
                            } else {
                                this.$message.error(`新增失败：${response.data.msg || '未知错误'}`);
                            }
                        })
                        .catch(() => {
                            this.$message.error('新增失败，请稍后再试');
                        });
                }
            });
        },

        updateSupplier(supplier) {
            this.currentSupplier = {
                ...supplier,
                // 确保供应数量是数字类型
                supplyQuantity: Number(supplier.supplyQuantity)
            };
            this.updateSupplierDialog = true;
        },
        submitUpdatedSupplier() {
            this.$refs.updateSupplierForm.validate((isValid) => {
                if (isValid) {
                    const dataToSubmit = {
                        ...this.currentSupplier,
                        supplyQuantity: Number(this.currentSupplier.supplyQuantity)
                    };
                    axios.post(`${this.baseURL}/yjx/supplier/updateSupplierManagement`, dataToSubmit)
                        .then(response => {
                            if (response.data.code === 200) {
                                this.$message.success('修改供应记录成功！');
                                this.updateSupplierDialog = false;
                                this.fetchTableData();
                            } else {
                                this.$message.error(`修改失败：${response.data.msg || '未知错误'}`);
                            }
                        })
                        .catch(() => {
                            this.$message.error('修改失败，请稍后再试');
                        });
                }
            });
        },

        deleteSupplier(supplier) {
            if (!supplier.supplierManagementId) {
                this.$message.error('供应记录ID缺失，无法删除');
                return;
            }

            this.$prompt('请输入密码确认删除', '删除确认', {
                inputType: 'password',
                confirmButtonText: '确定',
                cancelButtonText: '取消',
                inputPlaceholder: '输入当前用户密码'
            })
                .then(({value: userPasswd}) => {
                    if (!userPasswd.trim()) {
                        this.$message.error('密码不能为空');
                        return;
                    }

                    axios.post(
                        `${this.baseURL}/yjx/supplier/deleteSupplierManagement`,
                        null,
                        {
                            params: {
                                supplierManagementId: supplier.supplierManagementId,
                                userId: this.userId,
                                userPasswd: userPasswd
                            }
                        }
                    )
                        .then(response => {
                            if (response.data.code === 200) {
                                this.$message.success('删除供应记录成功！');
                                this.fetchTableData();
                            } else {
                                this.$message.error(`删除失败：${response.data.msg || '密码错误或无权限'}`);
                            }
                        })
                        .catch(() => {
                            this.$message.error('删除失败，请稍后再试');
                        });
                })
                .catch(() => {
                    this.$message.info('已取消删除操作');
                });
        },

        handleSortChange({prop, order}) {
            this.sortField = prop === 'supplierManagementId' ? 'supplier_management_id' :
                prop === 'supplierId' ? 'supplier_id' :
                    prop === 'partId' ? 'part_id' :
                        'created_at';
            this.sortOrder = order === 'ascending' ? 'asc' : 'desc';
            this.fetchTableData();
        },
        handleSizeChange(val) {
            this.pageSize = val;
            this.fetchTableData();
        },
        handleCurrentChange(val) {
            this.pageNum = val;
            this.fetchTableData();
        },

        goToPage(pageName) {
            window.location.href = `/${pageName}.html`;
        },
        goToIndex() {
            this.goToPage('index');
        },
        goToRepair() {
            this.goToPage('page/repair');
        },
        goToAccess() {
            this.goToPage('page/access');
        },
        goToUser() {
            this.goToPage('page/user');
        },
        goToSupplier() {
            this.goToPage('page/supplier');
        },

        logout() {
            this.$confirm('确定要退出登录吗？', '退出确认', {
                confirmButtonText: '确定',
                cancelButtonText: '取消',
                type: 'warning'
            })
                .then(() => {
                    Cookies.remove('userInfo');
                    this.goToPage('page/login');
                })
                .catch(() => {
                    this.$message.info('已取消退出操作');
                });
        }
    }
});