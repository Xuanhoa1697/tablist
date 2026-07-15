import { ActionContainer } from '@web/webclient/actions/action_container';
import { patch } from '@web/core/utils/patch';
import { AklMultiTab } from './components/multi_tab/akl_multi_tab';

import { xml, useState } from '@odoo/owl';
import { browser } from '@web/core/browser/browser';
import { useService } from '@web/core/utils/hooks';
import { user } from '@web/core/user';
import {
    router as _router
} from '@web/core/browser/router';
patch(ActionContainer.prototype, {
    setup() {

        super.setup();
        this.action_infos = [];
        this.controllerStacks = {};
        this.tab_menu_ids = {};
        this.action_service = useService('action');
        this.menu_service = useService('menu');

        this.env.bus.addEventListener(
            'ACTION_MANAGER:UPDATE',
            ({ detail: info }) => {
                this.action_infos = this.get_controllers(info);
                this.controllerStacks = info.controllerStacks;
                this.render();
            }
        );
    },
    _go_home() {
        // Raw history.pushState doesn't trigger Odoo's own router/action-service
        // reactivity (only back/forward "popstate" does), so nothing would ever
        // load. Go through the action service so it resolves a real controller
        // and fires ACTION_MANAGER:UPDATE, which our own bus listener uses to render.
        this.action_service.doAction(user.homeActionId || 'menu', { clearBreadcrumbs: true });
    },
    get_controllers(info) {
        const action_infos = [];
        const entries = Object.entries(info.controllerStacks);
        const current_app = this.menu_service.getCurrentApp();

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
                if (current_app) {
                    this.tab_menu_ids[key] = current_app.id;
                }
            }
            // Remember which app's menu this tab belongs to so we can restore
            // it when the tab is reactivated, since router state for a bare
            // "menu" (home) screen carries no app/menu identity.
            action_info.menu_id = this.tab_menu_ids[key];
            action_infos.push(action_info);
        })


        return action_infos;
    },

    // Activating a tab is more than flipping a flag: if that tab is sitting on
    // a bare app "menu" (home) screen, the cached component/props for it may
    // not be enough to show it correctly (the router state for a "menu"
    // screen carries no action) — so it must be resolved via doAction, same
    // as when the user clicks the tab directly. Every path that can make a
    // different tab become active (click, next/prev, closing the active tab,
    // "close others") must go through this so switching across apps works.
    _activate_tab(action_info) {
        this.action_infos.forEach((info) => {
            info.active = info.key === action_info.key;
        });
        if (action_info.menu_id) {
            this.menu_service.setCurrentMenu(action_info.menu_id);
        }
        var action = action_info.__info__.state.action;
        if (action == 'menu') {
            var actionStack = action_info.__info__.state.actionStack.filter(item => item.action != 'menu');
            if (actionStack.length && actionStack[0].action) {
                action = actionStack[0].action;
                this.action_service.doAction(action, { 'clearBreadcrumbs': true });
                return
            }
        }
        const url = _router.stateToUrl(action_info.__info__.state);
        browser.history.pushState({}, "", url);
        this.render();
    },
    _on_close_action(action_info) {
        this.action_infos = this.action_infos.filter((info) => {
            return info.key !== action_info.key;
        });
        delete this.controllerStacks[action_info.key];
        delete this.tab_menu_ids[action_info.key];

        if (this.action_infos.length > 0) {
            if (action_info.active) {
                const last = this.action_infos[this.action_infos.length - 1];
                this._activate_tab(last);
                return;
            }
        } else {
            this._go_home();
            return;
        }
        this.render();
    },
    _on_active_action(action_info) {
        this._activate_tab(action_info);
    },
    _close_other_action(action_info) {
        const keep_info = action_info || this.action_infos.find((info) => info.active);
        const was_active = !!keep_info?.active;
        this.action_infos = this.action_infos.filter((info) => {
            if (info.key !== keep_info?.key) {
                delete this.controllerStacks[info.key];
                delete this.tab_menu_ids[info.key];
            }
            return info.key === keep_info?.key;
        });

        if (!was_active && keep_info) {
            this._activate_tab(keep_info);
            return;
        }
        this.render();
    },
    _close_current_action() {
        this.action_infos = this.action_infos.filter((info) => {
            if (info.active == true) {
                delete this.controllerStacks[info.key];
                delete this.tab_menu_ids[info.key];
            }
            return info.active == false
        });
        if (this.action_infos.length > 0) {
            const last = this.action_infos[this.action_infos.length - 1];
            this._activate_tab(last);
            return;
        }
        this._go_home();
    },
    _on_close_all_action() {
        this.action_infos.forEach((info) => {
            delete this.controllerStacks[info.key];
            delete this.tab_menu_ids[info.key];
        });
        this.action_infos = [];
        this.render();
        this._go_home();

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
                close_other_action="(action_info) => this._close_other_action(action_info)"
                close_all_action="() => this._on_close_all_action()"
                multi_tab_next="(action_info) => this._on_multi_tab_next(action_info)"
                multi_tab_prev="(action_info) => this._on_multi_tab_prev(action_info)"
            />
            <div t-foreach="action_infos" t-as="action_info" t-if="action_info.active" t-key="action_info.key" class="akl_controller_container d-flex flex-column" t-att-class="action_info.active ? '' : 'd-none'" >
                <t t-if="action_info.Component" t-component="action_info.Component" className="'o_action'" t-props="action_info.componentProps" t-key="action_info.key"/>
            </div>
        </div>
    </t>
`;
