import React from 'react';
import { connect } from 'react-redux';
import Time from 'react-time';

// material ui
import { Button } from '@material-ui/core';
import { InfoOutlined as InfoIcon } from '@material-ui/icons';

import preauthImage from '../../../assets/img/preauthorize.png';
import { getDevicesByStatus, preauthDevice, selectGroup, setDeviceFilters } from '../../actions/deviceActions';
import { DEVICE_STATES } from '../../constants/deviceConstants';
import Loader from '../common/loader';
import DeviceList from './devicelist';
import { refreshLength as refreshDeviceLength } from './devices';
import PreauthDialog from './preauth-dialog';
import { getIdAttribute } from '../../selectors';

export class Preauthorize extends React.Component {
  constructor(props, context) {
    super(props, context);
    this.state = {
      openPreauth: false,
      pageNo: 1,
      pageLength: 20,
      pageLoading: true,
      sortCol: null,
      sortDown: true,
      sortScope: null
    };
  }

  componentDidMount() {
    this.props.selectGroup();
    this.props.setDeviceFilters([]);
    this.timer = setInterval(() => this._getDevices(), refreshDeviceLength);
    this._getDevices(true);
  }

  componentWillUnmount() {
    clearInterval(this.timer);
  }

  componentDidUpdate(prevProps) {
    if (prevProps.count !== this.props.count) {
      this._getDevices();
    }
    const self = this;
    if (!self.state.pageLoading && !self.props.devices.length && self.props.count) {
      //if devices empty but count not, put back to first page
      self._handlePageChange(1);
    }
  }

  shouldComponentUpdate(nextProps) {
    return !this.props.devices.every((device, index) => device === nextProps.devices[index]) || this.props.idAttribute !== nextProps.idAttribute || true;
  }

  /*
   * Devices to show
   */
  _getDevices(shouldUpdate = false) {
    const self = this;
    const { pageNo, pageLength, sortCol, sortDown, sortScope } = self.state;
    const sortBy = sortCol ? [{ attribute: sortCol, order: sortDown ? 'desc' : 'asc', scope: sortScope }] : undefined;
    self.props
      .getDevicesByStatus(DEVICE_STATES.preauth, pageNo, pageLength, shouldUpdate, undefined, sortBy)
      .finally(() => self.setState({ pageLoading: false }));
  }

  _handlePageChange(pageNo) {
    var self = this;
    self.setState({ pageLoading: true, expandRow: null, pageNo: pageNo }, () => self._getDevices(true));
  }

  _togglePreauth(openPreauth = !this.state.openPreauth) {
    this.setState({ openPreauth });
  }

  _savePreauth(authset, close) {
    var self = this;
    self.props
      .preauthDevice(authset)
      .then(() => {
        self._getDevices(true);
        self.setState({ openPreauth: !close });
      })
      .catch(errortext => {
        if (errortext) {
          self.setState({ errortext });
        }
      });
  }

  onSortChange(attribute) {
    const self = this;
    let state = { sortCol: attribute.name, sortDown: !self.state.sortDown, sortScope: attribute.scope };
    if (attribute.name !== self.state.sortCol) {
      state.sortDown = true;
    }
    state.sortCol = attribute.name === 'Device ID' ? 'id' : self.state.sortCol;
    self.setState(state, () => self._getDevices(true));
  }

  render() {
    const self = this;
    const { acceptedDevices, count, deviceLimit, devices, idAttribute, openSettingsDialog } = self.props;
    const { errorMessage, openPreauth, pageLoading } = self.state;
    const limitMaxed = deviceLimit && deviceLimit <= acceptedDevices;

    const columnHeaders = [
      {
        title: idAttribute,
        customize: openSettingsDialog,
        attribute: { name: idAttribute, scope: 'identity' },
        style: { flexGrow: 1 },
        sortable: true
      },
      {
        title: 'Date added',
        attribute: { name: 'created_ts', scope: 'system' },
        render: device => (device.created_ts ? <Time value={device.created_ts} format="YYYY-MM-DD HH:mm" /> : '-'),
        sortable: true
      },
      {
        title: 'Status',
        attribute: { name: 'status', scope: 'identity' },
        render: device => (device.status ? <div className="capitalized">{device.status}</div> : '-'),
        sortable: true
      }
    ];

    const deviceLimitWarning = limitMaxed ? (
      <p className="warning">
        <InfoIcon style={{ marginRight: '2px', height: '16px', verticalAlign: 'bottom' }} />
        You have reached your limit of authorized devices: {acceptedDevices} of {deviceLimit}
      </p>
    ) : null;

    return (
      <div className="tab-container">
        <div className="flexbox space-between" style={{ zIndex: 2, marginBottom: -1 }}>
          {count ? <h2 className="margin-right">Preauthorized devices</h2> : <div />}
          <div className="flexbox centered">
            <Button color="secondary" variant="contained" disabled={!!limitMaxed} onClick={() => this._togglePreauth(true)}>
              Preauthorize devices
            </Button>
          </div>
        </div>
        {deviceLimitWarning}
        <Loader show={pageLoading} />
        {devices.length && !pageLoading ? (
          <div className="padding-bottom">
            <DeviceList
              {...self.props}
              {...self.state}
              columnHeaders={columnHeaders}
              onPageChange={e => self._handlePageChange(e)}
              onChangeRowsPerPage={pageLength => self.setState({ pageNo: 1, pageLength }, () => self._handlePageChange(1))}
              onSort={attribute => self.onSortChange(attribute)}
              pageTotal={count}
              refreshDevices={shouldUpdate => self._getDevices(shouldUpdate)}
            />
          </div>
        ) : (
          <div className={pageLoading ? 'hidden' : 'dashboard-placeholder'}>
            <p>There are no preauthorized devices.</p>
            <p>
              {limitMaxed ? 'Preauthorize devices' : <a onClick={() => self._togglePreauth(true)}>Preauthorize devices</a>} so that when they come online, they
              will connect to the server immediately
            </p>
            <img src={preauthImage} alt="preauthorize" />
          </div>
        )}
        {openPreauth && (
          <PreauthDialog
            deviceLimitWarning={deviceLimitWarning}
            errortext={errorMessage}
            limitMaxed={limitMaxed}
            onSubmit={(data, addMore) => self._savePreauth(data, addMore)}
            onCancel={() => self._togglePreauth(false)}
            onChange={() => self.setState({ errorMessage: null })}
          />
        )}
      </div>
    );
  }
}

const actionCreators = { getDevicesByStatus, preauthDevice, selectGroup, setDeviceFilters };

const mapStateToProps = state => {
  return {
    acceptedDevices: state.devices.byStatus.accepted.total || 0,
    count: state.devices.byStatus.preauthorized.total,
    devices: state.devices.selectedDeviceList,
    deviceLimit: state.devices.limit,
    idAttribute: getIdAttribute(state)
  };
};

export default connect(mapStateToProps, actionCreators)(Preauthorize);
