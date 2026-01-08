import { ActionContainer } from '@web/webclient/actions/action_container';
import { patch } from '@web/core/utils/patch';
import { AklMultiTab } from './components/multi_tab/akl_multi_tab';

import { xml, useState } from '@odoo/owl';
import { browser } from '@web/core/browser/browser';
import { useService } from '@web/core/utils/hooks';
import {
    router as _router,
    stateToUrl
} from '@web/core/browser/router';
patch(ActionContainer.prototype, {
    setup() {

        super.setup();
        this.action_infos = [];
        this.controllerStacks = {};
        this.action_service = useService('action');

        this.env.bus.addEventListener(
            'ACTION_MANAGER:UPDATE',
            ({ detail: info }) => {
                this.action_infos = this.get_controllers(info);
                this.controllerStacks = info.controllerStacks;
                this.render();
            }
        );
    },
    get_controllers(info) {
        const action_infos = [];
        const entries = Object.entries(info.controllerStacks);

        entries.forEach(([key, stack]) => {
            const lastController = stack[stack.length - 1];

            const action_info = {
                key: key,
                __info__: lastController,
                Component: lastController.__info__.Component,
                active: false,
                componentProps: lastController.__info__.componentProps || {},
            }

            if (lastController.count == info.count) {
                action_info.active = true;
            }
            action_infos.push(action_info);
        })


        return action_infos;
    },

    _on_close_action(action_info) {
        this.action_infos = this.action_infos.filter((info) => {
            return info.key !== action_info.key;
        });
        if (this.action_infos.length > 0) {

            delete this.controllerStacks[action_info.key];
            this.action_infos[this.action_infos.length - 1].active = true; // Set last 
            this.render();

        }

    },
    _on_active_action(action_info) {
        this.action_infos.forEach((info) => {
            info.active = info.key === action_info.key;
        });
        var action = action_info.__info__.state.action;
        if (action == 'menu') {
            var actionStack = action_info.__info__.state.actionStack.filter(item => item.action != 'menu');
            if (actionStack.length && actionStack[0].action) {
                action = actionStack[0].action;
                this.action_service.doAction(action, { 'clearBreadcrumbs': true });
                return
            }
        }
        const url = stateToUrl(action_info.__info__.state);
        browser.history.pushState({}, "", url);
        this.render();
    },
    _close_other_action() {
        this.action_infos = this.action_infos.filter((info) => {
            if (info.active == false) {
                delete this.controllerStacks[info.key];
            }
            return info.active == true
        });

        this.render();
    },
    _close_current_action() {
        this.action_infos = this.action_infos.filter((info) => {
            if (info.active == true) {
                delete this.controllerStacks[info.key];
            }
            return info.active == false
        });
        this.action_infos[this.action_infos.length - 1].active = true;
        this.render();
    },
    _on_close_all_action() {
        this.action_infos.forEach((info) => {
            delete this.controllerStacks[info.key];
        });
        this.action_infos = {}
        window.location.href = "/";

    },
    _on_multi_tab_next(index) {
        var next_tab = this.action_infos[index + 1];
        this._on_active_action(next_tab)
    },
    _on_multi_tab_prev(index) {
        var next_tab = this.action_infos[index > 0 ? index - 1 : 0];
        this._on_active_action(next_tab)
    }
});
ActionContainer.components = {
    ...ActionContainer.components,
    AklMultiTab,
};
ActionContainer.template = xml`
 <t t-name="web.ActionContainer">
        <t t-set="action_infos" t-value="action_infos" />
        <div class="o_action_manager d-flex flex-colum">
       <AklMultiTab 
                action_infos="action_infos"
                active_action="(action_info) => this._on_active_action(action_info)"
                close_action="(action_info) => this._on_close_action(action_info)"
                close_current_action="() => this._close_current_action()"
                close_other_action="() => this._close_other_action()"
                close_all_action="() => this._on_close_all_action()"
                multi_tab_next="(action_info) => this._on_multi_tab_next(action_info)"
                multi_tab_prev="(action_info) => this._on_multi_tab_prev(action_info)"
            />
            <div t-foreach="action_infos" t-as="action_info" t-if="action_info.active" t-key="action_info.key" class="akl_controller_container d-flex flex-column" t-att-class="action_info.active ? '' : 'd-none'" >
                <t t-component="action_info.Component" className="'o_action'" t-props="action_info.componentProps" />
            </div>
        </div>
    </t>
`;
