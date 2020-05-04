import React from 'react';
import { connect } from 'react-redux';

import { BarChart as BarChartIcon } from '@material-ui/icons';

import ChartAdditionWidget from './widgets/chart-addition';
import DistributionReport from './widgets/distribution';
import EnterpriseNotification from '../common/enterpriseNotification';
import { selectGroup } from '../../actions/deviceActions';
import { saveGlobalSettings } from '../../actions/userActions';
import { DEVICE_STATES } from '../../constants/deviceConstants';

export const defaultReports = [{ group: null, attribute: 'artifact_name', type: 'distribution' }];

const reportTypes = {
  distribution: DistributionReport
};

const defaultChartStyle = {
  width: 380,
  height: 280
};

export class SoftwareDistribution extends React.Component {
  constructor(props, state) {
    super(props, state);
    this.state = {
      reports: props.reports.length ? props.reports : defaultReports,
      selection: ''
    };
  }

  addCurrentSelection(selection) {
    const reports = [...this.state.reports, selection];
    this.setState({ reports });
    this.props.saveGlobalSettings({ [`${this.props.userId}-reports`]: reports });
  }

  removeReport(index) {
    const reports = this.state.reports;
    reports.splice(index, 1);
    this.setState({ reports });
  }

  render() {
    const self = this;
    const { devices, groups, hasDevices, isEnterprise, selectGroup } = self.props;
    const { reports } = self.state;
    return !isEnterprise ? (
      <div className="flexbox centered">
        <EnterpriseNotification isEnterprise={isEnterprise} benefit="gain actionable insights into the devices you are updating with Mender" />
      </div>
    ) : (
      <div>
        <h4 className="dashboard-header">
          <span>Software distribution</span>
        </h4>
        {hasDevices ? (
          <div className="flexbox" style={{ flexWrap: 'wrap' }}>
            {reports.map((report, index) => {
              const Component = reportTypes[report.type];
              return (
                <Component
                  attribute={report.attribute}
                  devices={devices}
                  groups={groups}
                  group={report.group}
                  key={`report-${index}`}
                  onClick={() => self.removeReport(index)}
                  selectGroup={selectGroup}
                  style={defaultChartStyle}
                />
              );
            })}
            <ChartAdditionWidget groups={groups} onAdditionClick={selection => self.addCurrentSelection(selection)} style={defaultChartStyle} />
          </div>
        ) : (
          <div className="dashboard-placeholder">
            <BarChartIcon style={{ transform: 'scale(5)' }} />
            <p className="margin-top-large">Software distribution charts will appear here once you connected a device. </p>
          </div>
        )}
      </div>
    );
  }
}

const actionCreators = { saveGlobalSettings, selectGroup };

const mapStateToProps = state => {
  const plan = state.users.organization ? state.users.organization.plan : 'os';
  const userId = (state.users.byId[state.users.currentUser] || {}).id;
  return {
    attributes: state.devices.filteringAttributes.inventoryAttributes.concat(state.devices.filteringAttributes.identityAttributes) || [],
    devices: state.devices.byId,
    hasDevices: state.devices.byStatus[DEVICE_STATES.accepted].total,
    groups: state.devices.groups.byId,
    isEnterprise: state.app.features.isEnterprise || (state.app.features.isHosted && plan !== 'os'),
    reports: state.users.globalSettings[`${userId}-reports`] || [],
    userId
  };
};

export default connect(mapStateToProps, actionCreators)(SoftwareDistribution);
