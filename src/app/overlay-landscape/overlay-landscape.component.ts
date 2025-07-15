import { Component, OnInit, OnDestroy, Renderer2, Inject, ChangeDetectorRef, NgZone } from '@angular/core';
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
    private mobileBreakpointWidth: number = 920;

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
        const MOBILE_MAX_WIDTH = this.mobileBreakpointWidth;
        const isMobileDevice = window.innerWidth <= MOBILE_MAX_WIDTH || window.innerHeight <= MOBILE_MAX_WIDTH;
        const isLandscape = window.matchMedia("(orientation: landscape)").matches;
        const wasOverlayShowing = this.showRotateOverlay;

        this.showRotateOverlay = isMobileDevice && isLandscape;
        this.cdr.detectChanges();

        if (this.showRotateOverlay && !wasOverlayShowing) {
            this.renderer.addClass(this.document.body, 'no-scroll');
        } else if (!this.showRotateOverlay && wasOverlayShowing) {
            this.renderer.removeClass(this.document.body, 'no-scroll');
        }
    }
}