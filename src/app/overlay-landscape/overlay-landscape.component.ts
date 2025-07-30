import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';

@Component({
    selector: 'app-overlay-landscape',
    standalone: true,
    imports: [CommonModule, TranslateModule],
    templateUrl: './overlay-landscape.component.html',
    styleUrls: ['./overlay-landscape.component.scss']
})
export class OverlayLandscapeComponent implements OnInit, OnDestroy {
    activeLanguage: string = 'de';

    constructor(
    ) { }

    ngOnInit(): void {

    }

    ngOnDestroy(): void {
    }


}