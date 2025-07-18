import { Component, OnInit, OnDestroy, Renderer2, Inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule, DOCUMENT } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { TranslateManagerService } from '../services/translate/translate-manager.service';
import { Subscription, fromEvent } from 'rxjs';
import { debounceTime, tap } from 'rxjs/operators';

@Component({
    selector: 'app-overlay-landscape',
    standalone: true,
    imports: [CommonModule, TranslateModule],
    templateUrl: './overlay-landscape.component.html',
    styleUrls: ['./overlay-landscape.component.scss']
})
export class OverlayLandscapeComponent implements OnInit, OnDestroy {
    showRotateOverlay: boolean = false;
    activeLanguage: string = 'de';
    private resizeObserver: ResizeObserver | undefined;
    private translateSubscription: Subscription | undefined;
    private resizeSubscription: Subscription | undefined;
    private mobileDeviceThreshold: number = 768;

    constructor(
        private translateManager: TranslateManagerService,
        private renderer: Renderer2,
        @Inject(DOCUMENT) private document: Document,
        private cdr: ChangeDetectorRef,
    ) { }

    ngOnInit(): void {
        this.translateSubscription = this.translateManager.activeLanguage$.subscribe(lang => {
            this.activeLanguage = lang;
            this.checkOrientation();
        });

        this.checkOrientation();
        this.resizeSubscription = fromEvent(window, 'resize').pipe(
            debounceTime(50),
            tap(() => this.checkOrientation())
        ).subscribe();

        if (typeof ResizeObserver !== 'undefined') {
            this.resizeObserver = new ResizeObserver(() => {
            });
            this.resizeObserver.observe(this.document.body);
        }
    }

    ngOnDestroy(): void {
        if (this.resizeObserver) {
            this.resizeObserver.disconnect();
        }

        if (this.translateSubscription) {
            this.translateSubscription.unsubscribe();
        }

        if (this.resizeSubscription) {
            this.resizeSubscription.unsubscribe();
        }

        this.renderer.removeClass(this.document.body, 'no-scroll');
    }

    checkOrientation(): void {
        const MAX_MOBILE_WIDTH_PORTRAIT = 768;
        const MAX_MOBILE_HEIGHT_LANDSCAPE = 500;
        const isLandscape = window.matchMedia("(orientation: landscape)").matches;
        const wasOverlayShowing = this.showRotateOverlay;

        this.showRotateOverlay = isLandscape && (window.innerWidth <= MAX_MOBILE_WIDTH_PORTRAIT || window.innerHeight <= MAX_MOBILE_HEIGHT_LANDSCAPE);
        this.cdr.detectChanges();

        if (this.showRotateOverlay && !wasOverlayShowing) {
            this.renderer.addClass(this.document.body, 'no-scroll');
        } else if (!this.showRotateOverlay && wasOverlayShowing) {
            this.renderer.removeClass(this.document.body, 'no-scroll');
        }
    }
}