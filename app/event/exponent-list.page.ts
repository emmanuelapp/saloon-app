import {OnInit} from "@angular/core";
import {Page} from "ionic-angular";
import {NavController} from "ionic-angular/index";
import {EventItem, EventFull} from "./models/Event";
import {ExponentFull} from "./models/Exponent";
import {EventData} from "./services/event.data";
import {Filter} from "../common/utils/array";
import {UiHelper} from "../common/ui/utils";
import {RatingComponent} from "../common/components/rating.component";
import {ExponentItemComponent} from "./components/exponent-item.component";
import {ExponentPage} from "./exponent.page";

@Page({
    directives: [RatingComponent, ExponentItemComponent],
    template: `
<ion-navbar *navbar>
    <button menuToggle><ion-icon name="menu"></ion-icon></button>
    <ion-title>Exposants</ion-title>
</ion-navbar>
<ion-toolbar>
    <ion-searchbar [(ngModel)]="searchQuery" (input)="search()" debounce="500"></ion-searchbar>
</ion-toolbar>
<ion-content>
    <div *ngIf="!eventFull" style="text-align: center; margin-top: 100px;"><ion-spinner></ion-spinner></div>
    <ion-list-header *ngIf="eventFull && filtered.length === 0">Pas d'exposant trouvé</ion-list-header>
    <ion-list *ngIf="eventFull && filtered.length > 0" [virtualScroll]="filtered" [headerFn]="virtualHeader">
        <ion-item-divider *virtualHeader="let letter" sticky>{{letter}}</ion-item-divider>
        <!--TODO : do not work.... :( <exponent-item *virtualItem="let exponent" [exponent]="exponent" (click)="goToExponent(exponent)"></exponent-item>-->
        <ion-item *virtualItem="let exponent" (click)="goToExponent(exponent)">
            <ion-avatar item-left><ion-img [src]="exponent.logo"></ion-img></ion-avatar>
            <h2>{{exponent.name}} <rating *ngIf="getRating(exponent) > 0" [value]="getRating(exponent)"></rating></h2>
            <p class="nowrap lines2">{{exponent.description}}</p>
            <button clear item-right (click)="toggleFav(exponent);$event.stopPropagation();">
                <ion-icon name="star" [hidden]="!getFav(exponent)"></ion-icon>
                <ion-icon name="star-outline" [hidden]="getFav(exponent)"></ion-icon>
            </button>
        </ion-item>
    </ion-list>
</ion-content>
`,
})
export class ExponentListPage implements OnInit {
    eventItem: EventItem;
    eventFull: EventFull;
    searchQuery: string = '';
    filtered: ExponentFull[] = [];
    constructor(private _nav: NavController,
                private _eventData: EventData,
                private _uiHelper: UiHelper) {}

    ngOnInit() {
        this.eventItem = this._eventData.getCurrentEventItem();
        this._eventData.getCurrentEventFull().then(event => {
            this.eventFull = event;
            // TODO : should watch this.eventFull changes to update this.filtered (updated after restert right now...)
            this.filtered = Filter.deep(this.eventFull.exponents, this.searchQuery);
            this._uiHelper.hideLoading();
        });
    }

    search() {
        this.filtered = Filter.deep(this.eventFull.exponents, this.searchQuery);
    }

    virtualHeader(item, index, array) {
        if(index === 0 || item.name[0].toUpperCase() !== array[index-1].name[0].toUpperCase()) {
            return item.name[0].toUpperCase();
        }
        return null;
    }

    getFav(exponent: ExponentFull): boolean { return this._eventData.getExponentFavorite(exponent); }
    toggleFav(exponent: ExponentFull) { this._eventData.toggleExponentFavorite(exponent); }
    getRating(exponent: ExponentFull): number { return this._eventData.getExponentRating(exponent); }

    goToExponent(exponentFull: ExponentFull) {
        this._nav.push(ExponentPage, {
            exponentItem: exponentFull.toItem()
        });
    }
}
