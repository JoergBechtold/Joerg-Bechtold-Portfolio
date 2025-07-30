// import { Component, OnInit, OnDestroy, Renderer2, Inject, ChangeDetectorRef } from '@angular/core';
// import { CommonModule, DOCUMENT } from '@angular/common';
// import { TranslateModule } from '@ngx-translate/core';
// import { TranslateManagerService } from '../services/translate/translate-manager.service';
// import { Subscription, fromEvent } from 'rxjs';
// import { debounceTime, tap } from 'rxjs/operators';

// @Component({
//     selector: 'app-overlay-landscape',
//     standalone: true,
//     imports: [CommonModule, TranslateModule],
//     templateUrl: './overlay-landscape.component.html',
//     styleUrls: ['./overlay-landscape.component.scss']
// })
// export class OverlayLandscapeComponent implements OnInit, OnDestroy {
//     showRotateOverlay: boolean = false;
//     activeLanguage: string = 'de';
//     private translateSubscription: Subscription | undefined;
//     private resizeSubscription: Subscription | undefined;

//     constructor(
//         private translateManager: TranslateManagerService,
//         private renderer: Renderer2,
//         @Inject(DOCUMENT) private document: Document,
//         private cdr: ChangeDetectorRef,
//     ) { }

//     ngOnInit(): void {
//         this.translateSubscription = this.translateManager.activeLanguage$.subscribe(lang => {
//             this.activeLanguage = lang;
//             this.checkOrientation();
//         });

//         this.checkOrientation();

//         this.resizeSubscription = fromEvent(window, 'resize').pipe(
//             debounceTime(50),
//             tap(() => this.checkOrientation())
//         ).subscribe();
//     }

//     ngOnDestroy(): void {
//         if (this.translateSubscription) {
//             this.translateSubscription.unsubscribe();
//         }

//         if (this.resizeSubscription) {
//             this.resizeSubscription.unsubscribe();
//         }
//         this.renderer.removeClass(this.document.body, 'no-scroll');
//     }

//     isTouchDevice(): boolean {
//         return 'ontouchstart' in window || navigator.maxTouchPoints > 0 || (navigator as any).msMaxTouchPoints > 0;
//     }

//     checkOrientation(): void {
//         const MAX_LANDSCAPE_WIDTH_FOR_OVERLAY = 920;
//         const isLandscape = window.matchMedia("(orientation: landscape)").matches;
//         const isTouch = this.isTouchDevice();
//         const currentWidth = window.innerWidth;
//         const wasOverlayShowing = this.showRotateOverlay;

//         this.showRotateOverlay = isTouch && isLandscape && (currentWidth <= MAX_LANDSCAPE_WIDTH_FOR_OVERLAY);
//         this.cdr.detectChanges();

//         if (this.showRotateOverlay && !wasOverlayShowing) {
//             this.renderer.addClass(this.document.body, 'no-scroll');
//         } else if (!this.showRotateOverlay && wasOverlayShowing) {
//             this.renderer.removeClass(this.document.body, 'no-scroll');
//         }
//     }
// }

import { Component, OnInit, OnDestroy } from '@angular/core'; // Renderer2, Inject, ChangeDetectorRef, DOCUMENT entfernt
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
// TranslateManagerService, Subscription, fromEvent, debounceTime, tap entfernt, da Overlay-Logik rein CSS wird

@Component({
    selector: 'app-overlay-landscape',
    standalone: true,
    imports: [CommonModule, TranslateModule],
    templateUrl: './overlay-landscape.component.html',
    styleUrls: ['./overlay-landscape.component.scss']
})
export class OverlayLandscapeComponent implements OnInit, OnDestroy {
    // showRotateOverlay: boolean = false; // Wird nicht mehr benötigt
    activeLanguage: string = 'de'; // Wird beibehalten für i18n in den Texten

    // private translateSubscription: Subscription | undefined; // Wird nicht mehr benötigt für Overlay-Logik
    // private resizeSubscription: Subscription | undefined; // Wird nicht mehr benötigt

    constructor(
        // private translateManager: TranslateManagerService, // Nicht mehr direkt für Overlay-Logik benötigt
        // private renderer: Renderer2, // Nicht mehr benötigt
        // @Inject(DOCUMENT) private document: Document, // Nicht mehr benötigt
        // private cdr: ChangeDetectorRef, // Nicht mehr benötigt
    ) { }

    ngOnInit(): void {
        // this.translateSubscription = this.translateManager.activeLanguage$.subscribe(lang => {
        //   this.activeLanguage = lang;
        //   // this.checkOrientation(); // Wird nicht mehr benötigt
        // });
        // this.checkOrientation(); // Wird nicht mehr benötigt

        // this.resizeSubscription = fromEvent(window, 'resize').pipe(
        //   debounceTime(50),
        //   tap(() => this.checkOrientation())
        // ).subscribe(); // Wird nicht mehr benötigt
    }

    ngOnDestroy(): void {
        // if (this.translateSubscription) {
        //   this.translateSubscription.unsubscribe();
        // }
        // if (this.resizeSubscription) {
        //   this.resizeSubscription.unsubscribe();
        // }
        // this.renderer.removeClass(this.document.body, 'no-scroll'); // Wird nicht mehr benötigt
    }

    // isTouchDevice(): boolean { // Wird nicht mehr benötigt
    //   return 'ontouchstart' in window || navigator.maxTouchPoints > 0 || (navigator as any).msMaxTouchPoints > 0;
    // }

    // checkOrientation(): void { // Wird nicht mehr benötigt
    //   const MAX_LANDSCAPE_WIDTH_FOR_OVERLAY = 920;
    //   const isLandscape = window.matchMedia("(orientation: landscape)").matches;
    //   const isTouch = this.isTouchDevice();
    //   const currentWidth = window.innerWidth;
    //   const wasOverlayShowing = this.showRotateOverlay;

    //   this.showRotateOverlay = isTouch && isLandscape && (currentWidth <= MAX_LANDSCAPE_WIDTH_FOR_OVERLAY);
    //   this.cdr.detectChanges();

    //   if (this.showRotateOverlay && !wasOverlayShowing) {
    //     this.renderer.addClass(this.document.body, 'no-scroll');
    //   } else if (!this.showRotateOverlay && wasOverlayShowing) {
    //     this.renderer.removeClass(this.document.body, 'no-scroll');
    //   }
    // }
}