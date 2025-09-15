new Vue({
  el: '#app',
  data() {
    return {
      activeIndex: '3-1',      // 当前导航选中的菜单项
      searchKeyword: '',
      tableData: [],         // 表格数据
      loading: false,        // 加载状态
      userId: 1,             // 用户ID
      userRole: 1,           // 用户角色
      pageNum: 1,            // 当前页码
      pageSize: 10,          // 每页显示条数
      sortField: 'partId', // 排序字段
      sortOrder: 'asc',     // 排序顺序
      count: 0,              // 总记录数
      addPartDialog: false, // 是否显示添加配件的弹窗
      updatePartDialog: false, // 是否显示修改配件的弹窗
      currentPart: {}, // 当前被选中的配件数据
      newPart: {
        partName: '',
        partPrice:'',
        stockQuantity: '',
        supplierId:''
      },
      suppliers: [], // 供应商列表
    };
  },
  created() {
    this.fetchTableData(); // 初始化获取表格数据
    this.fetchSuppliers(); // 初始化获取供应商列表
  },
  methods: {
    // 实时更新搜索关键词
    updateSearch(value) {
      this.searchKeyword = value;
      console.log(`查询来自: ${value}`);
    },

    // 搜索后端数据
    filterTable() {
      console.log(`查询来自: ${this.searchKeyword}`);
      this.fetchTableData();
    },

    // 获取所有供应商
    fetchSuppliers() {
      axios.get('http://127.0.0.1:8081/yjx/parts/getSupplierList')
        .then(response => {
          if (response.data.code === 200) {
            this.suppliers = response.data.data.map(item => ({
              supplierName: item.supplierName,
              supplierId: item.supplierId,
            }))
          } else {
            this.$message.error(`获取维修人列表失败：${response.data.msg}`);
          }
        })
        .catch(error => {
          console.error('获取供应商列表失败:', error);
        });
    },

    // 获取表格数据，支持带参数的搜索
    fetchTableData() {
      this.loading = true;
      console.log('使用参数从后端获取表数据:', {
        userId: this.userId,
        userRole: this.userRole,
        searchKeyword: this.searchKeyword,
        pageNum: this.pageNum,
        pageSize: this.pageSize,
        sortField: this.sortField,
        sortOrder: this.sortOrder,
      });

      // 使用 Axios 发送请求到后端
      axios.get('http://127.0.0.1:8081/yjx/parts/list', {
        params: {
          userId: this.userId,
          userRole: this.userRole,
          searchKeyword: this.searchKeyword,
          pageNum: this.pageNum,
          pageSize: this.pageSize,
          sortField: this.sortField,
          sortOrder: this.sortOrder,
        }
      })
      .then(response => {
        console.log('后端返回的数据:', response.data);
        // 假设后端返回的数据在 response.data.repairRequest
        const pageResult = response.data.data;
        this.tableData = pageResult.records.map(item => ({
          partId: item.partId,
          partName: item.partName,
          partDescription: item.partDescription,
          partPrice: item.partPrice,
          stockQuantity: item.stockQuantity,
          supplierId: item.supplierId,
          createdAt: item.createdAt,
        }));
        this.count = pageResult.total; // 总记录数
      })
      .catch(error => {
        console.error('获取表数据时出错:', error);
        this.$message.error('获取数据失败，请稍后再试。');
      })
      .finally(() => {
        this.loading = false;
      });
    },

    handleSortChange({ prop, part }) {
      // 传递排序参数到后端
      this.sortField = prop;
      this.sortOrder = part === 'ascending' ? 'asc' : 'desc';
      this.fetchTableData();
    },
    //详情展示
    viewPartDetails(part) {
      this.$alert(
        `<h3>订单详情：</h3>
        配件单号：${part.partId} <br>
        配件名称：${part.partName} <br>
        配件描述：${part.partDescription} <br>
        配件价格：${part.partPrice} <br>
        配件数量：${part.stockQuantity} <br>
        供应商id：${part.supplierId} <br>
        创建时间：${part.createdAt}`,
        '配件详情',
        {
          dangerouslyUseHTMLString: true,
          confirmButtonText: '确定'
        }
      );
    },


    // 修改订单
    updatePart(part) {
      // 深拷贝订单数据，确保 part_id 被传递
      this.currentPart = {
        partId: part.partId,
        partName: part.partName,
        partPrice: part.partPrice,
        stockQuantity: part.stockQuantity,
        supplierId :part.supplierId,
        partDescription:part.partDescription,
      };
      this.updatePartDialog = true; // 打开弹窗
    },

    submitUpdatedPart() {
      // 确保 part_id 存在
      if (!this.currentPart.partId) {
        this.$message.error('配件 ID 缺失，无法提交修改！');
        return;
      }

      axios.post('http://127.0.0.1:8081/yjx/parts/updatePart', this.currentPart, {
        headers: {
          'Content-Type': 'application/json',
        },
      })
          .then((response) => {
            if (response.data.code === 200) {
              this.$message.success('配件修改成功！');
              this.fetchTableData(); // 刷新表格数据
              this.updatePartDialog = false; // 关闭弹窗
            } else {
              this.$message.error(`修改失败：${response.data.message}`);
            }
          })
          .catch((error) => {
            console.error('修改配件失败:', error);
            this.$message.error(`修改配件失败：${error.response?.data?.message || error.message}`);
          });
    },
    //删除
    deletePart(part) {
      this.$confirm(
        `确认删除订单 ID ${part.partId} 吗？`,
        '删除确认',
        {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'warning',
        }
      )
      .then(() => {
        // 调用后端删除接口
        axios.delete(`http://127.0.0.1:8081/yjx/parts/delete/${part.partId}`, {
          withCredentials: true // 若后端 CORS 开了 setAllowCredentials(true)，必须加这行
        })
          .then((response) => {
            if (response.data.code === 200) {
              this.tableData = this.tableData.filter(o => o.partId !== part.partId);
              this.$message.success('订单删除成功！');
            } else {
              this.$message.error(`删除失败：${response.data.message}`);
            }
          })
          .catch(() => {
            this.$message.error('删除订单失败，请稍后再试。');
          });
      })
      .catch(() => {
        this.$message.info('取消删除操作');
      });
    },
    //退出
    logout() {
      this.$confirm('你确定要退出登录吗？', '退出确认', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning',
      })
      .then(() => {
        Cookies.remove('userInfo');
        window.location.href = '/page/login.html';
      })
      .catch(() => {
        this.$message.info('已取消退出操作');
      });
    },

    // 分页组件方法
    handleSizeChange(val) {
      this.pageSize = val;
      this.fetchTableData();
    },
    handleCurrentChange(val) {
      this.pageNum = val;
      this.fetchTableData();
    },

    // 添加订单（逻辑占位）
    addPart() {
      // 打开添加订单的弹窗
      this.newPart = {
        partName: '',
        partPrice:'',
        stockQuantity: '',
        supplierId:'',
      }; // 重置表单数据
      this.addPartDialog = true;
    },

    submitNewPart() {
      if (!this.newPart.partName || !this.newPart.partPrice || !this.newPart.stockQuantity || !this.newPart.supplierId) {
        this.$message.error('请填写完整信息！');
        return;
      }
      const newPart = {
          partName: this.newPart.partName,
          partPrice: this.newPart.partPrice,
          stockQuantity:this.newPart.stockQuantity,
          supplierId:this.newPart.supplierId
      };
      axios.post('http://127.0.0.1:8081/yjx/parts/addPart', newPart)
          .then((response) => {
            if (response.data.code === 200) {
              this.$message.success('配件添加成功！');
              this.fetchTableData(); // 刷新表格数据
              this.addPartDialog = false; // 关闭弹窗
            } else {
              this.$message.error(`添加失败：${response.data.message}`);
            }
          })
          .catch((error) => {
            console.error('添加订单失败:', error);
            this.$message.error('添加订单失败，请稍后重试。');
          });
    },
    // 跳转的方法
    goToIndex() {window.location.href = '/index.html';},
    goToRepair() {window.location.href = '/page/repair.html';},
    goToAccess() {window.location.href = '/page/access.html';},
    goToUser() {window.location.href = '/page/user.html';},
    goTosupplier() {window.location.href = '/page/supplier.html';},
  },
});
