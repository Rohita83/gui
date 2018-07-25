import React from 'react';
import Form from '../common/forms/form';
import SelectInput from '../common/forms/selectinput';
import PasswordInput from '../common/forms/passwordinput';
import { isEmpty, preformatWithRequestID, deepCompare } from '../../helpers.js';

require('../common/prototype/Array.prototype.equals');

var createReactClass = require('create-react-class');
var AppActions = require('../../actions/app-actions');

import FlatButton from 'material-ui/FlatButton';
import RaisedButton from 'material-ui/RaisedButton';
import FontIcon from 'material-ui/FontIcon';


var Global = createReactClass({
	getInitialState() {
		return {
			disabled: true,
			settings: {
				id_attribute: "Device ID",
			},
			updatedSettings: {
				id_attribute: "Device ID",
			},
			id_attributes: [{value:"Device ID", label:"Device ID"}],
		};
	},
	componentDidMount() {
		this.getSettings();
		this.getIdentityAttributes();
	},
	getSettings: function() {
		var self = this;
		var callback = {
			success: function(settings) {
				if (!isEmpty(settings)) {
					self.setState({settings: settings, updatedSettings: settings});
				}
			},
			error: function(err) {
				console.log("error");
			}
		};
		AppActions.getGlobalSettings(callback);
	},
	getIdentityAttributes: function() {
		var self = this;
		var callback = {
			success: function(devices) {
				if (!isEmpty(devices)) {
					// if devices found, get id attributes from first
					var attributes = [{value:"Device ID", label:"Device ID"}];
					Object.keys(devices[0].attributes).forEach(function (x) {
						attributes.push({value: x, label: x});
					});
					self.setState({id_attributes: attributes});
				}
			},
			error: function(err) {
				console.log("error");
			}
		};
		AppActions.getDevicesByStatus(callback);
	},

	changeIdAttribute: function (value) { 
		var self = this;
		this.setState({updatedSettings: {id_attribute: value}});
	},

	hasChanged: function () {
		// compare to see if any changes were made
		var changed = this.state.updatedSettings ? !deepCompare(this.state.settings, this.state.updatedSettings) : false;
		return changed;
	},

	undoChanges: function() {
		var self = this;
		this.setState({updatedSettings: self.state.settings});
		if (this.props.dialog) {
			this.props.closeDialog();
		}
	},

	saveSettings: function() {
		var self = this;
		var callback = {
			success: function() {
				self.setState({settings: self.state.updatedSettings});
				AppActions.setSnackbar("Settings saved successfully");
				if (self.props.dialog) {
					self.props.closeDialog();
				}
			},
			error: function(err) {
				console.log(err);
				AppActions.setSnackbar(preformatWithRequestID(err.res, "The settings couldn't be saved. " + err.res.body.error));
			}
		};
		AppActions.saveGlobalSettings(self.state.updatedSettings, callback);
	},

	render: function() {
		var changed = this.hasChanged();
		var id_hint = "Choose which device identity attribute is displayed by default in the UI (this does not have any effect on the operation of the devices)";

		return (
			<div style={{maxWidth: "750px"}} className="margin-top-small">

		        {this.props.dialog ? null : 
		        	<div>
		        		<h2 style={{marginTop: "15px"}}>Global settings</h2>
		        		<p className="info" style={{marginBottom: "30px"}}><FontIcon className="material-icons" style={{marginRight:"4px", fontSize:"18px", top: "4px"}}>info_outline</FontIcon>These settings apply to all users, so changes made here may affect other users' experience.</p>
		        	</div>
		        }
		        
		        <Form>

		          <SelectInput
		          	hint="Default device identity attribute"
		            label="Default device identity attribute"
		            id="deviceid"
		            onChange={this.changeIdAttribute}
		            menuItems={this.state.id_attributes}
		            style={{width: "400px"}}
		            value={this.state.updatedSettings.id_attribute}
		            extraHint={id_hint} />
		        </Form>
		        
		        <div className="margin-top-large">
  					<div className="float-right">
			            <FlatButton disabled={!changed && !this.props.dialog} onClick={this.undoChanges} style={{marginRight:"10px"}} label="Cancel" />
			            <RaisedButton onClick={this.saveSettings} disabled={!changed} primary={true} label="Save" />
		            </div>
		        </div>

		       
	    	</div>
		)
	},

});

module.exports = Global;