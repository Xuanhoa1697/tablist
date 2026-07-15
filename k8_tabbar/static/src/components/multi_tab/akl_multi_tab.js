import { Component, useRef, useState, useExternalListener, onWillStart } from '@odoo/owl';
import { Dropdown } from '@web/core/dropdown/dropdown';
import { DropdownItem } from '@web/core/dropdown/dropdown_item';
import { DropdownGroup } from '@web/core/dropdown/dropdown_group';
import { ensureJQuery } from '@web/core/ensure_jquery';
export class AklMultiTab extends Component {
  static template = 'akl_multi_tab.tab';
  static components = { Dropdown, DropdownItem, DropdownGroup };
  static props = ['*'];
  setup() {
    super.setup();
    this.tabContainerRef = [];
    this.contextMenuState = useState({ visible: false, x: 0, y: 0, action_info: null });
    useExternalListener(window, 'click', () => this._close_context_menu());
    useExternalListener(window, 'blur', () => this._close_context_menu());
    onWillStart(async () => {
      await ensureJQuery()
    })
  }
  rollPage() { }
  _close_all_action() { this.props.close_all_action(); }
  _close_current_action() {
    this.props.close_current_action();
  }
  _close_other_action() {
    const active_info = this.props.action_infos.find((info) => info.active);
    this.props.close_other_action(active_info);
  }
  _on_click_tab_close(info) {
    this._close_context_menu();
    this.props.close_action(info);
  }
  _on_click_tab_item(info) {
    this._close_context_menu();
    this.props.active_action(info);
  }
  _on_tab_contextmenu(ev, info) {
    ev.preventDefault();
    ev.stopPropagation();
    this.contextMenuState.visible = true;
    this.contextMenuState.x = ev.clientX;
    this.contextMenuState.y = ev.clientY;
    this.contextMenuState.action_info = info;
  }
  _close_context_menu() {
    this.contextMenuState.visible = false;
    this.contextMenuState.action_info = null;
  }
  _on_contextmenu_close_tab() {
    const info = this.contextMenuState.action_info;
    this._close_context_menu();
    if (info) {
      this.props.close_action(info);
    }
  }
  _on_contextmenu_close_other_tabs() {
    const info = this.contextMenuState.action_info;
    this._close_context_menu();
    if (info) {
      this.props.close_other_action(info);
    }
  }
  _on_contextmenu_close_all_tabs() {
    this._close_context_menu();
    this.props.close_all_action();
  }
  _on_multi_tab_next(ev) {
    this._close_context_menu();
    var index = $(ev.currentTarget).closest('.akl_multi_tab').find('.akl_page_tab_item.active').attr('index');
    if (index && Number(index) == this.props.action_infos.length - 1) return
    this.props.multi_tab_next(Number(index));
  }
  _on_multi_tab_prev(ev) {
    this._close_context_menu();
    var index = $(ev.currentTarget).closest('.akl_multi_tab').find('.akl_page_tab_item.active').attr('index');
    if (index && Number(index) == 0) return
    this.props.multi_tab_prev(Number(index));
  }
  get action_infos() { }
  get current_action_info() { }
}
