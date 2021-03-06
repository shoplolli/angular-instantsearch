import { Component, Input, Inject, forwardRef } from '@angular/core';
import { connectBreadcrumb } from 'instantsearch.js/es/connectors';
import { BaseWidget } from '../base-widget';
import { NgAisInstantSearch } from '../instantsearch/instantsearch';
import { noop } from '../utils';

export type BreadcrumbState = {
  createURL: (value: string) => string;
  items: BreadcrumbItem[];
  refine: (value: string) => void;
};

export type BreadcrumbItem = {
  name: string;
  value: string;
};

@Component({
  selector: 'ais-breadcrumb',
  template: `
    <div
      [class]="cx()"
      *ngIf="!isHidden"
    >
      <ul [class]="cx('list')">
        <li
          *ngFor="let item of items"
          [ngClass]="[cx('item'), item.isLast ? cx('item', 'selected') : '']"
          (click)="handleClick($event, item)"
        >
          <span
            *ngIf="item.separator"
            [class]="cx('separator')"
            aria-hidden="true"
          >
            >
          </span>
          <a
            [class]="cx('link')"
            href="{{state.createURL(item.value)}}"
            *ngIf="!item.isLast"
            (click)="handleClick($event, item)"
          >
            {{item.label}}
          </a>

          <span *ngIf="item.isLast">
            {{item.label}}
          </span>
        </li>
      </ul>
    </div>
  `,
})
export class NgAisBreadcrumb extends BaseWidget {
  // instance options
  @Input() public attributes: string[];
  @Input() public rootPath?: string;
  @Input() public separator?: string;
  @Input()
  public transformItems?: <U extends BreadcrumbItem>(
    items: BreadcrumbItem[]
  ) => U[];

  get isHidden() {
    return this.state.items.length === 0 && this.autoHideContainer;
  }

  get items() {
    return this.state.items.map((item, idx) => ({
      ...item,
      separator: idx !== 0,
      isLast: idx === this.state.items.length - 1,
      // FIXME: get rid of this. We can use `last` local variable
      // https://angular.io/api/common/NgForOf#local-variables
    }));
  }

  public state: BreadcrumbState = {
    createURL: () => '#',
    items: [],
    refine: noop,
  };

  constructor(
    @Inject(forwardRef(() => NgAisInstantSearch))
    public instantSearchParent: any
  ) {
    super('Breadcrumb');
  }

  public ngOnInit() {
    this.createWidget(connectBreadcrumb, {
      attributes: this.attributes,
      rootPath: this.rootPath,
      separator: this.separator,
      transformItems: this.transformItems,
    });

    super.ngOnInit();
  }

  public handleClick(event: MouseEvent, item: BreadcrumbItem): void {
    event.preventDefault();
    event.stopPropagation();

    if (item.value) {
      this.state.refine(item.value);
    }
  }
}
