sap.ui.define([
	"sap/ui/core/mvc/Controller",
	"sap/base/Log",
	"sap/ui/model/json/JSONModel",
	"../model/formatter",
	"sap/ui/model/Filter",
	"sap/ui/model/FilterOperator",
	"sap/ui/core/UIComponent"
], function (Controller, Log, JSONModel, formatter, Filter, FilterOperator, UIComponent) {
	"use strict";

	return Controller.extend("com.deere.Movies.controller.App", {

		formatter: formatter,

		onInit: function () {
			Log.info("Controller has been initialized.");
		},

		/*onBeforeRendering: function () {
			Log.info("View will shortly be rendered.");
		},*/

		onAfterRendering: function () {
			var that = this;
			var oView = this.getView();
			that.fnGetBot();
		},

		fnGetBot: function () {
			var that = this;
			$.ajax({
				type: 'GET',
				// url: "https://" + "api.cai.tools.sap/build/v1/dialog/saswatachandra",
				//url: "https://" + "api.cai.tools.sap/v2/request",
				url: "https://" + "api.cai.tools.sap/auth/v1/owners/saswatachandra",
				headers: {
					"Authorization": "Token 75da0bea573e25d41987e80b9d93725e"
				},
				success: function (oData, response) {
					if (oData.results.owner.id) {
						that.uuid = oData.results.owner.id;
					} else {
						that.uuid = '';
					}
				},
				error: function (oResponse) {
					that.uuid = '';
				}
			});
		},

		/*onExit: function () {
			Log.info("Controller will shortly be destroyed.");
		},*/

		onChatBtnPress: function (oEvent) {
			var that = this;
			var oView = this.getView();
			if (!this._PopDialog) {
				this._PopDialog = sap.ui.xmlfragment("com.deere.Movies.view.chatBot", this);
				oView.addDependent(this._PopDialog);
			}
			this._PopDialog.openBy(oView.byId("id_chatBot"));
		},

		fnChatBotClose: function (oEvent) {
			if (this._PopDialog) {
				this._PopDialog.close();
			}
		},

		fnChatBotWriteTextOnEnter: function (oEvent) {
			var that = this;
			var vInWrittenVal = sap.ui.getCore().byId("id_IPReply").getValue();
			sap.ui.getCore().byId("id_IPReply").setValue("");
			sap.ui.getCore().byId("id_BtnResPopBotOnEnter").setEnabled(false);
			if (vInWrittenVal) {
				that.fnAddContentToChatWindowFromUserInput(vInWrittenVal);
				that.fnChatInputPost(vInWrittenVal);
			}

		},

		fnChatInputPost: function (vInWrittenVal) {
			var that = this;
			var oData = {
				"message": {
					"type": "text",
					"content": vInWrittenVal
				},
				"conversation_id": "test-1234567890",
				"log_level": "info"
			};
			$.ajax({
				type: "POST",
				data: JSON.stringify(oData),
				url: "https://" + "api.cai.tools.sap/build/v1/dialog",
				contentType: "application/json",
				path: "/build/v1/dialog",
				scheme: "https",
				headers: {
					"Authorization": "Token 75da0bea573e25d41987e80b9d93725e",
					"x-uuid": that.uuid
				},
				success: function (oData, oResponse) {
					if (oData.results) {
						that.vBotResText = oData.results.messages[0].content;
					} else {
						that.vBotResText = "Sorry! I'm not trained enough to answer this";
					}
					that.fnAddContentToChatWindowFromPost(that.vBotResText);
				},
				error: function (oResponse) {

				}

			});
		},

		fnAddContentToChatWindowFromPost: function (vTextVal) {
			var oVBox = sap.ui.getCore().byId("id_VBChatWindow");
			var oFBoxBotIP = new sap.m.FlexBox({
				justifyContent: "Start",
				BackgroundDesign: "Translucent",
				renderType: "Div"
			}).addStyleClass("cl_ChatFlexBox");
			var oBotText = new sap.m.Text({
				text: vTextVal
			}).addStyleClass("cl_BotIPTextClr");
			oFBoxBotIP.addItem(oBotText);
			oVBox.addItem(oFBoxBotIP);
		},

		fnAddContentToChatWindowFromUserInput: function (vInWrittenVal) {
			var oVBox = sap.ui.getCore().byId("id_VBChatWindow");
			var oFBoxBotIP = new sap.m.FlexBox({
				justifyContent: "End",
				BackgroundDesign: "Translucent",
				renderType: "Div"
			}).addStyleClass("cl_ChatFlexBox");
			var oBotText = new sap.m.Text({
				text: vInWrittenVal
			}).addStyleClass("cl_UserIPTextClr");
			oFBoxBotIP.addItem(oBotText);
			oVBox.addItem(oFBoxBotIP);
		},

		onPress: function (sValue) {
			sap.ui.require(["sap/m/MessageToast"], function (oMessage) {
				var oResourceBundle = this.getOwnerComponent().getModel("i18n").getResourceBundle();
				oMessage.show(oResourceBundle.getText("search") + " " + sValue);
			}.bind(this));

			var sCity = this.byId('city').getValue(),
				sGenre = this.byId('genre').getSelectedItem().getKey(),
				oCalendar = this.byId("calendar"),
				oRowBinding = oCalendar.getBinding("rows"),
				oFilterGenre,
				oFilterCity;

			// Create filters for genre and city according to user inputs
			oFilterGenre = sGenre ? new Filter("genre", FilterOperator.EQ, sGenre) : null;
			oFilterCity = sCity ? new Filter("info", FilterOperator.Contains, sCity) : null;

			// Apply genre filter to calendar rows
			oRowBinding.filter(oFilterGenre);

			// Apply city filter to row appointments
			var aRows = oCalendar.getAggregation("rows");
			aRows.forEach(function (oItem) {
				var oAppointmentsBinding = oItem.getBinding("appointments");
				oAppointmentsBinding.filter(oFilterCity);
			});
		},

		onAppointmentSelect: function (oAppointment) {
			var oContext = oAppointment.getBindingContext("movies"),
				sPath = oContext.getPath();

			var aParameters = sPath.split("/");
			UIComponent.getRouterFor(this).navTo("Detail", {
				movieId: aParameters[2],
				appointmentId: aParameters[4]
			});
		}

	});
});