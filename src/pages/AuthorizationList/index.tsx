import { addRule, removeRule, userinfo, updateRole } from '@/services/ant-design-pro/api';
import type { ActionType, ProColumns, ProDescriptionsItemProps } from '@ant-design/pro-components';
import {
  FooterToolbar,
  ModalForm,
  PageContainer,
  ProDescriptions,
  ProForm,
  ProFormText,
  ProFormTextArea,
  ProTable,
} from '@ant-design/pro-components';
import { FormattedMessage, useIntl } from '@umijs/max';
import { Button, Drawer, Form, message, Space, Divider, Typography, Input } from 'antd';
import React, { useRef, useState } from 'react';
const { Text } = Typography;

const TableList: React.FC = () => {
  const [createModalOpen, handleModalOpen] = useState<boolean>(false);
  const [showDetail, setShowDetail] = useState<boolean>(false);
  const [currentRow, setCurrentRow] = useState<API.UserListItem>();
  const [selectedRowsState, setSelectedRows] = useState<API.UserListItem[]>([]);
  const actionRef = useRef<ActionType>();
  const intl = useIntl();
  const [form] = Form.useForm<API.User | { sex: string }>();
  const [area, setArea] = useState<string[]>([]);

  const handleAdd = async (fields: API.RuleListItem) => {
    const hide = message.loading('正在添加');
    try {
      await addRule({ ...fields });
      hide();
      message.success('添加成功');
      return true;
    } catch (error) {
      hide();
      message.error('添加失败，请重试！');
      return false;
    }
  };

  const handleRemove = async (selectedRows: API.RuleListItem[]) => {
    const hide = message.loading('正在删除');
    if (!selectedRows) return true;
    try {
      await removeRule({
        key: selectedRows.map((row) => row.key),
      });
      hide();
      message.success('删除成功');
      return true;
    } catch (error) {
      hide();
      message.error('删除失败，请重试');
      return false;
    }
  };

  // 字符串分割并只保留中文字符
  const handleAreaInput = (input: string) => {
    // 将字符串按非中文字符进行分割，并过滤掉空项
    const chineseAreas = input.split(/[^一-龥]+/).filter(item => item.trim() !== '');
    setArea(chineseAreas);
  };

  const columns: ProColumns<API.UserListItem>[] = [
    {
      title: <FormattedMessage id="pages.authorzationTable.ruleName.nameLabel" defaultMessage="user name" />,
      dataIndex: 'username',
      tip: '主键',
      render: (dom, entity) => (
        <a
          onClick={() => {
            setCurrentRow(entity);
            setShowDetail(true);
          }}
        >
          {dom}
        </a>
      ),
    },
    {
      title: <FormattedMessage id="pages.authorzationTable.userInfo" defaultMessage="Info" />,
      dataIndex: 'user_id',
      tip: '用户信息',
      render: (_, info) => {
        return (
          <>
            <ModalForm<API.User>
              title="主要信息"
              form={form}
              initialValues={info}
              trigger={<a>查看详情</a>}
              modalProps={{
                destroyOnClose: true,
                onCancel: () => console.log('Modal closed'),
              }}
              onOpenChange={(open) => {
                if (open) {
                  form.setFieldsValue({ ...info, sex: !!info.sex ? '女' : '男' });
                }
              }}
              submitTimeout={2000}
              onFinish={async () => {
                return true;
              }}
            >
              <Divider />
              <Space direction="vertical" size="middle">
                <Text strong>个人信息</Text>
                <ProForm.Group>
                  <ProFormText width="sm" name="username" label="姓名" disabled />
                  <ProFormText width="sm" name="mobile" label="电话号码" disabled />
                  <ProFormText width="sm" name="address" label="地址" disabled />
                  <ProFormText width="sm" name="sex" label="性别" disabled />
                  <ProFormText width="sm" name="birthday" label="出生日期" disabled />
                  <ProFormText width="sm" name="email" label="邮箱" disabled />
                </ProForm.Group>
              </Space>
            </ModalForm>
          </>
        );
      },
    },
    {
      title: <FormattedMessage id="pages.authorzationTable.area" defaultMessage="area" />,
      dataIndex: 'option',
      valueType: 'option',
      render: (_, record) => {
        return [
          <Input
            key="area"
            onChange={(e) => handleAreaInput(e.target.value)}
            placeholder="请输入地区，用逗号分隔"
          />,
          <Button
            key="submit-role-change"
            type="link"
            onClick={async () => {
              const success = await updateRole({
                user_id: record.id,
                new_role: record.highest_role,
                new_region: area,
              });
              if (success) {
                message.success('角色变更成功');
                actionRef.current?.reload();
              } else {
                message.error('角色变更失败，请重试');
              }
            }}
          >
            提交变更
          </Button>,
        ];
      },
    },
  ];

  return (
    <PageContainer>
      <ProTable<API.UserListItem, API.PageParams>
        headerTitle={intl.formatMessage({ id: 'pages.searchTable.title', defaultMessage: 'Enquiry form' })}
        actionRef={actionRef}
        rowKey="username"
        search={{
          labelWidth: 120,
        }}
        request={async (params) => {
          const { current, pageSize, ...filters } = params;
          const res = await userinfo({ current, pageSize }).then((res) => res.data.list);
          console.log('res',res);
          
          // 过滤 role 为 42 以上的用户
          const filteredList = res.filter((item) => item.highest_role >= 42);

          
          // 进一步过滤其它参数
          const finalList = filteredList.filter((item) => {
            return Object.keys(filters).every((name) => {
              //@ts-ignore
              return String(item[name]) === String(filters[name]);
            });
          });
        
          return {
            data: finalList,
            success: true,
            total: finalList.length,
          };
        }}
        
        
        columns={columns}
        // rowSelection={{
        //   onChange: (_, selectedRows) => {
        //     setSelectedRows(selectedRows);
        //   },
        // }}
      />
      {selectedRowsState?.length > 0 && (
        <FooterToolbar
          extra={
            <div>
              <FormattedMessage id="pages.searchTable.chosen" defaultMessage="Chosen" />{' '}
              <a style={{ fontWeight: 600 }}>{selectedRowsState.length}</a>{' '}
              <FormattedMessage id="pages.searchTable.item" defaultMessage="项" />
              &nbsp;&nbsp;
              <span>
                <FormattedMessage id="pages.searchTable.totalServiceCalls" defaultMessage="Total number of service calls" />{' '}
                {selectedRowsState.reduce((pre, item) => pre + item.callNo!, 0)}{' '}
                <FormattedMessage id="pages.searchTable.tenThousand" defaultMessage="万" />
              </span>
            </div>
          }
        >
          <Button
            onClick={async () => {
              await handleRemove(selectedRowsState);
              setSelectedRows([]);
              actionRef.current?.reloadAndRest?.();
            }}
          >
            <FormattedMessage id="pages.searchTable.batchDeletion" defaultMessage="Batch Deletion" />
          </Button>
        </FooterToolbar>
      )}
      <ModalForm
        title={intl.formatMessage({ id: 'pages.searchTable.createForm.newRule', defaultMessage: 'New rule' })}
        open={createModalOpen}
        onOpenChange={handleModalOpen}
        onFinish={async (value) => {
          const success = await handleAdd(value as API.RuleListItem);
          if (success) {
            handleModalOpen(false);
            if (actionRef.current) {
              actionRef.current.reload();
            }
          }
        }}
      >
        <ProFormText
          rules={[
            {
              required: true,
              message: <FormattedMessage id="pages.searchTable.ruleName" defaultMessage="Rule name is required" />,
            },
          ]}
          width="md"
          name="name"
        />
        <ProFormTextArea
          name="desc"
          width="md"
          rules={[
            {
              required: true,
              message: <FormattedMessage id="pages.searchTable.ruleDesc" defaultMessage="Rule description is required" />,
            },
          ]}
        />
      </ModalForm>
      <Drawer
        width={600}
        open={!!showDetail}
        onClose={() => {
          setCurrentRow(undefined);
          setShowDetail(false);
        }}
        closable={false}
      >
        {currentRow?.name && (
          <ProDescriptions<API.UserListItem>
            column={2}
            title={currentRow?.name}
            request={async () => ({
              data: currentRow || {},
            })}
            params={{
              id: currentRow?.name,
            }}
            columns={columns as ProDescriptionsItemProps<API.UserListItem>[]}
          />
        )}
      </Drawer>
    </PageContainer>
  );
};

export default TableList;
