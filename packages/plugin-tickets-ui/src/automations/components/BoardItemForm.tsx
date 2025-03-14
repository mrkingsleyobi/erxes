import { Alert } from "@erxes/ui/src/utils";
import { BoardItemWrapper } from "../styles";
import BoardSelect from "@erxes/ui-tickets/src/boards/containers/BoardSelect";
import Common from "@erxes/ui-automations/src/components/forms/actions/Common";
import { IAction } from "@erxes/ui-automations/src/types";
import { IPipelineLabel } from "@erxes/ui-tickets/src/boards/types";
import { IUser } from "@erxes/ui/src/auth/types";
import { PRIORITIES } from "@erxes/ui-tickets/src/boards/constants";
import PlaceHolderInput from "@erxes/ui-automations/src/components/forms/actions/placeHolder/PlaceHolderInput";
import React from "react";
import SelectFields from "@erxes/ui-automations/src/containers/forms/actions/SelectFields";
import client from "@erxes/ui/src/apolloClient";
import { gql } from "@apollo/client";
import { queries as pipelineQuery } from "@erxes/ui-tickets/src/boards/graphql";
type Props = {
  closeModal: () => void;
  activeAction: IAction;
  addAction: (action: IAction, actionId?: string, config?: any) => void;
  triggerType: string;
  triggerConfig: any;
  pipelineLabels?: IPipelineLabel[];
  users: IUser[];
};

type State = {
  config: any;
  pipelineLabels: IPipelineLabel[];
};

class BoardItemForm extends React.Component<Props, State> {
  constructor(props) {
    super(props);

    const { activeAction, pipelineLabels = [] } = this.props;
    let { config } = activeAction;
    if (!config) {
      config = {};
    }

    this.state = {
      config,
      pipelineLabels
    };
  }

  componentWillReceiveProps(nextProps) {
    if (nextProps.activeAction !== this.props.activeAction) {
      this.setState({ config: nextProps.activeAction.config });
    }
  }

  onChangeField = (name: string, value: string) => {
    const { config } = this.state;
    config[name] = value;

    this.setState({ config });
  };

  renderSelect() {
    const type = "ticket";

    const { stageId, pipelineId, boardId } = this.state.config;

    const stgIdOnChange = stgId => this.onChangeField("stageId", stgId);
    const plIdOnChange = plId => {
      client
        .query({
          query: gql(pipelineQuery.pipelineLabels),
          fetchPolicy: "network-only",
          variables: { pipelineId: plId }
        })
        .then(data => {
          this.setState({ pipelineLabels: data.data.ticketsPipelineLabels });
        })
        .catch(e => {
          Alert.error(e.message);
        });
      this.onChangeField("pipelineId", plId);
    };
    const brIdOnChange = brId => this.onChangeField("boardId", brId);

    return (
      <BoardSelect
        type={type}
        stageId={stageId || ""}
        pipelineId={pipelineId || ""}
        boardId={boardId || ""}
        onChangeStage={stgIdOnChange}
        onChangePipeline={plIdOnChange}
        onChangeBoard={brIdOnChange}
      />
    );
  }

  onChange = rConf => {
    const { config } = this.state;

    this.setState({ config: { ...config, ...rConf } });
  };

  render() {
    const { triggerType, users, activeAction, triggerConfig } = this.props;
    const { config, pipelineLabels } = this.state;

    const userOptions = (users || []).map(u => ({
      label: (u.details && u.details.fullName) || u.email,
      value: u._id
    }));

    const labelOptions = (pipelineLabels || []).map(l => ({
      label: l.name,
      value: l._id || ""
    }));

    const priorityOptions = PRIORITIES.map(p => ({ label: p, value: p }));

    return (
      <Common config={this.state.config} {...this.props}>
        <BoardItemWrapper>
          {this.renderSelect()}
          <PlaceHolderInput
            inputName="cardName"
            label="Name"
            config={config}
            onChange={this.onChange}
            triggerType={triggerType}
            triggerConfig={triggerConfig}
            attrWithSegmentConfig={true}
          />
          <PlaceHolderInput
            inputName="description"
            label="Description"
            config={config}
            onChange={this.onChange}
            triggerConfig={triggerConfig}
            attrWithSegmentConfig={true}
            triggerType={triggerType}
          />
          <PlaceHolderInput
            inputName="assignedTo"
            label="Assigned To"
            config={config}
            onChange={this.onChange}
            triggerType={triggerType}
            fieldType="select"
            attrType="user"
            options={userOptions}
            isMulti={true}
          />
          <PlaceHolderInput
            inputName="closeDate"
            label="Close Date"
            config={config}
            onChange={this.onChange}
            triggerType={triggerType}
            fieldType="date"
            attrType="Date"
            customAttributions={[
              {
                _id: String(Math.random()),
                label: "Now",
                name: "now",
                type: "Date"
              },
              {
                _id: String(Math.random()),
                label: "Tomorrow",
                name: "tomorrow",
                type: "Date"
              },
              {
                _id: String(Math.random()),
                label: "Next Week",
                name: "nextWeek",
                type: "Date"
              },
              {
                _id: String(Math.random()),
                label: "Next Month",
                name: "nextMonth",
                type: "Date"
              }
            ]}
          />
          <PlaceHolderInput
            inputName="labelIds"
            label="Labels"
            config={config}
            onChange={this.onChange}
            triggerType={triggerType}
            fieldType="select"
            excludeAttr={true}
            options={labelOptions}
            isMulti={true}
          />
          <PlaceHolderInput
            inputName="priority"
            label="Priority"
            config={config}
            onChange={this.onChange}
            triggerType={triggerType}
            fieldType="select"
            excludeAttr={true}
            options={priorityOptions}
          />
          <SelectFields
            config={config}
            onSelect={this.onChange}
            triggerConfig={triggerConfig}
            customAttributions={[
              {
                _id: String(Math.random()),
                name: "attachments",
                label: "Attachments",
                type: "files",
                excludeAttr: true,
                callback: () =>
                  this.setState({
                    config: { ...config, attachments: "{{ attachments }}" }
                  })
              }
            ]}
            label="Add Fields"
            excludedNames={[
              "name",
              "description",
              "assignedUserIds",
              "createdAt",
              "parentId",
              "closeDate",
              "labelIds",
              "priority",
              "stageId"
            ]}
            triggerType={triggerType}
            actionType={activeAction.type.replace(".create", "")}
          />
        </BoardItemWrapper>
      </Common>
    );
  }
}

export default BoardItemForm;
