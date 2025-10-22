import { Component, useRef, onWillStart } from '@odoo/owl';
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
    this.props.close_other_action();
  }
  _on_click_tab_close(info) {
    this.props.close_action(info);
  }
  _on_click_tab_item(info) {
    this.props.active_action(info);
  }
  _on_multi_tab_next(ev) { 
    var index = $(ev.currentTarget).closest('.akl_multi_tab').find('.akl_page_tab_item.active').attr('index');
    if (index && Number(index) == this.props.action_infos.length - 1) return
    this.props.multi_tab_next(Number(index));
  }
  _on_multi_tab_prev(ev) { 
    var index = $(ev.currentTarget).closest('.akl_multi_tab').find('.akl_page_tab_item.active').attr('index');
    if (index && Number(index) == 0) return
    this.props.multi_tab_prev(Number(index));
  }
  get action_infos() { }
  get current_action_info() { }
}
