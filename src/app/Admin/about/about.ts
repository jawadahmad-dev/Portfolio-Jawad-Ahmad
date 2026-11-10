import { Component, OnInit, inject } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { TextareaModule } from 'primeng/textarea';
import { Shared } from '../../Core/Services/shared';
import { Rest } from '../../Core/Services/rest';


@Component({
  selector: 'app-about',
  imports: [ReactiveFormsModule, ButtonModule, InputTextModule, TextareaModule],
  templateUrl: './about.html',
  styleUrl: './about.scss',
})
export class About implements OnInit {
  private readonly sharedService = inject(Shared);
  private readonly restService = inject(Rest);
  private readonly fb = inject(FormBuilder);
  Aboutform!: FormGroup;
  HeroSectionForm!: FormGroup;

  ngOnInit(): void {
    this.initAboutForm();
    this.initHeroSectionForm();
  }


  initAboutForm(){
this.Aboutform = this.fb.group({
  details: ['',Validators.required],
})
  }

  initHeroSectionForm(){
    this.HeroSectionForm = this.fb.group({
      title: ['',Validators.required],
      subtitle: ['',Validators.required],
      description: ['',Validators.required],
      resume: ['', Validators.required],
      image: ['', Validators.required],
    })
  }

  onAboutSubmit(){
  }

  onHeroSectionSubmit(){
  }

}
