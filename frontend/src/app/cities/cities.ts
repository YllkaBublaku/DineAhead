import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { RouterLink, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { Header } from '../header/header';
import { Footer } from '../footer/footer';
import { ApiService } from '../services/api.service';

interface CityData {
  id: number;
  name: string;
  imageUrl: string;
  country: string;
  countryFlag: string;
  restaurantCount: number;
}

@Component({
  selector: 'app-cities',
  standalone: true,
  imports: [ CommonModule, Header, Footer],
  templateUrl: './cities.html',
  styleUrl: './cities.css'
})
export class Cities implements OnInit {
  cities: CityData[] = [];
  groupedCities: { [country: string]: CityData[] } = {};
  loading = false;

  constructor(private api: ApiService, private cdr: ChangeDetectorRef, private router: Router) {}

  ngOnInit(): void {
    this.loadCities();
  }

  loadCities(): void {
    this.loading = true;

    this.api.getCities()
      .then((data) => {
        if (data && Array.isArray(data)) {
          this.cities = data.map((city: any) => ({
            id: city.id,
            name: city.name,
            imageUrl: city.imageUrl,
            country: city.country,
            countryFlag: city.countryFlag || '🌍',
            restaurantCount: city.restaurantCount || 0
          }));
          this.groupByCountry();
          this.cdr.detectChanges();
        }
        this.loading = false;
        this.cdr.detectChanges();
      })
      .catch((error) => {
        console.error('Error loading cities:', error);
        this.loading = false;
        this.cities = [];
        this.groupedCities = {};
        this.cdr.detectChanges();
      });
  }

  goToCity(cityName: string): void {
    this.router.navigate(['/restaurants'], {
      queryParams: {
        city: cityName,
      }
    });
  }

  groupByCountry(): void {
    this.groupedCities = {};
    this.cities.forEach(city => {
      if (!this.groupedCities[city.country]) {
        this.groupedCities[city.country] = [];
      }
      this.groupedCities[city.country].push(city);
    });
  }

  getCountryKeys(): string[] {
    return Object.keys(this.groupedCities).sort();
  }

  getPopularCities(country: string): CityData[] {
    return this.groupedCities[country]?.slice(0, 4) || [];
  }
}
