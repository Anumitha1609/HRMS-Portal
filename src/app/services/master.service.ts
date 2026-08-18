import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, throwError } from 'rxjs';
import { catchError, map, shareReplay } from 'rxjs/operators';

// ---------------------------------------------------------------------------
// Data source note:
// This service previously called the Prism AI backend (/api/masters/*,
// /api/geocode, /api/reverse-geocode, /api/ctcs/*) over HTTP. It now reads
// from local JSON files bundled with the app (under /data/*.json) and keeps
// an in-memory working copy for create/update/delete during the session.
// Public method names, signatures and return shapes are unchanged so every
// component that consumes this service keeps working exactly as before.
// ---------------------------------------------------------------------------

export interface MasterRecord {
  id: string;
  name: string;
  latitude?: number;
  longitude?: number;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  pinCode?: string;
  timezone?: string;
  employeeCount?: number;
  createdAt?: string;
  subCategories?: SubCategoryRecord[];
}

export interface SubCategoryRecord {
  id: string;
  categoryId: string;
  name: string;
  createdAt?: string;
}

interface GeoPlace {
  name: string;
  latitude: number;
  longitude: number;
  address: string;
  city?: string;
  state?: string;
  country?: string;
  pinCode?: string;
  timezone?: string;
}

const MASTER_DATA_FILES: { [type: string]: string } = {
  location: '/data/locations.json',
  sublocation: '/data/sublocations.json',
  department: '/data/departments.json',
  functionalunit: '/data/functional-units.json',
  division: '/data/divisions.json',
  category: '/data/categories.json'
};

const CTC_DATA_FILE = '/data/ctcs.json';
const GEO_DATA_FILE = '/data/geo-places.json';

@Injectable({
  providedIn: 'root'
})
export class MasterService {
  // In-memory working copies, keyed by master type / dataset name.
  private store: { [type: string]: MasterRecord[] } = {};
  private loaders: { [type: string]: Observable<MasterRecord[]> } = {};

  private ctcStore: any[] | null = null;
  private ctcLoader$: Observable<any[]> | null = null;

  private geoStore: GeoPlace[] | null = null;
  private geoLoader$: Observable<GeoPlace[]> | null = null;

  constructor(private http: HttpClient) {}

  // --- Internal loaders -----------------------------------------------

  private loadMasterType(type: string): Observable<MasterRecord[]> {
    if (this.store[type]) {
      return of(this.store[type]);
    }
    const file = MASTER_DATA_FILES[type];
    if (!file) {
      this.store[type] = [];
      return of(this.store[type]);
    }
    if (!this.loaders[type]) {
      this.loaders[type] = this.http.get<MasterRecord[]>(file).pipe(
        map((data) => {
          this.store[type] = (data || []).map((d) => ({
            ...d,
            subCategories: d.subCategories ? d.subCategories.map((s) => ({ ...s })) : undefined
          }));
          return this.store[type];
        }),
        shareReplay(1)
      );
    }
    return this.loaders[type];
  }

  private loadCtcs(): Observable<any[]> {
    if (this.ctcStore) {
      return of(this.ctcStore);
    }
    if (!this.ctcLoader$) {
      this.ctcLoader$ = this.http.get<any[]>(CTC_DATA_FILE).pipe(
        map((data) => {
          this.ctcStore = (data || []).map((d) => ({ ...d, components: d.components ? d.components.map((c: any) => ({ ...c })) : [] }));
          return this.ctcStore;
        }),
        shareReplay(1)
      );
    }
    return this.ctcLoader$;
  }

  private loadGeoPlaces(): Observable<GeoPlace[]> {
    if (this.geoStore) {
      return of(this.geoStore);
    }
    if (!this.geoLoader$) {
      this.geoLoader$ = this.http.get<GeoPlace[]>(GEO_DATA_FILE).pipe(
        map((data) => {
          this.geoStore = data || [];
          return this.geoStore;
        }),
        shareReplay(1)
      );
    }
    return this.geoLoader$;
  }

  private notFoundError(message: string) {
    return throwError(() => ({ error: { error: message } }));
  }

  // --- Master CRUD (location, sublocation, department, functionalunit,
  //     division, category) --------------------------------------------

  getMasters(type: string): Observable<MasterRecord[]> {
    return this.loadMasterType(type).pipe(map((list) => list.map((r) => ({ ...r }))));
  }

  createMaster(type: string, name: string, extraData?: Partial<MasterRecord>): Observable<MasterRecord> {
    return this.loadMasterType(type).pipe(
      map((list) => {
        const newRecord: MasterRecord = {
          id: `${type}-${Date.now()}`,
          name,
          employeeCount: 0,
          createdAt: new Date().toISOString(),
          ...extraData
        };
        list.push(newRecord);
        return { ...newRecord };
      })
    );
  }

  updateMaster(type: string, id: string, name: string, extraData?: Partial<MasterRecord>): Observable<MasterRecord> {
    return this.loadMasterType(type).pipe(
      map((list) => {
        const idx = list.findIndex((r) => r.id === id);
        if (idx === -1) {
          throw { error: { error: 'Record not found' } };
        }
        const updated: MasterRecord = { ...list[idx], name, ...extraData };
        list[idx] = updated;
        return { ...updated };
      }),
      catchError((err) => throwError(() => err))
    );
  }

  deleteMaster(type: string, id: string): Observable<any> {
    return this.loadMasterType(type).pipe(
      map((list) => {
        const idx = list.findIndex((r) => r.id === id);
        if (idx !== -1) {
          list.splice(idx, 1);
        }
        return { success: true };
      })
    );
  }

  // --- Geocoding & Map (local lookup against a small seed dataset,
  //     no external / backend calls) ------------------------------------

  geocode(query: string): Observable<any[]> {
    const q = (query || '').toLowerCase().trim();
    if (!q) {
      return of([]);
    }
    return this.loadGeoPlaces().pipe(
      map((places) =>
        places
          .filter((p) => p.name.toLowerCase().includes(q) || (p.address || '').toLowerCase().includes(q))
          .slice(0, 6)
          .map((p) => ({ ...p }))
      )
    );
  }

  reverseGeocode(lat: number, lng: number): Observable<any> {
    return this.loadGeoPlaces().pipe(
      map((places) => {
        let nearest: GeoPlace | null = null;
        let minDist = Infinity;
        for (const p of places) {
          const dist = Math.hypot(p.latitude - lat, p.longitude - lng);
          if (dist < minDist) {
            minDist = dist;
            nearest = p;
          }
        }
        if (nearest && minDist < 2) {
          return { ...nearest, latitude: lat, longitude: lng };
        }
        // No close match: construct a generic address from the coordinates.
        return {
          name: `Location (${lat.toFixed(4)}, ${lng.toFixed(4)})`,
          latitude: lat,
          longitude: lng,
          address: `Near ${lat.toFixed(4)}, ${lng.toFixed(4)}`,
          city: '',
          state: '',
          country: 'India',
          pinCode: '',
          timezone: 'Asia/Kolkata'
        };
      })
    );
  }

  searchLocations(query: string): Observable<MasterRecord[]> {
    const q = (query || '').toLowerCase().trim();
    return this.loadMasterType('location').pipe(
      map((list) => (q ? list.filter((r) => r.name.toLowerCase().includes(q)) : list).map((r) => ({ ...r })))
    );
  }

  // --- CTC Master --------------------------------------------------------

  getCtcs(filters?: any): Observable<any> {
    return this.loadCtcs().pipe(
      map((all) => {
        let results = [...all];

        if (filters) {
          if (filters.name) {
            const q = String(filters.name).toLowerCase();
            results = results.filter((r) => r.ctcName.toLowerCase().includes(q));
          }
          if (filters.minAmount !== undefined && filters.minAmount !== '' && filters.minAmount !== null) {
            results = results.filter((r) => r.annualCTC >= Number(filters.minAmount));
          }
          if (filters.maxAmount !== undefined && filters.maxAmount !== '' && filters.maxAmount !== null) {
            results = results.filter((r) => r.annualCTC <= Number(filters.maxAmount));
          }
          if (filters.status && filters.status !== 'All') {
            results = results.filter((r) => r.status === filters.status);
          }

          const sortBy = filters.sortBy || 'createdAt';
          const sortOrder = filters.sortOrder === 'asc' ? 1 : -1;
          results.sort((a, b) => {
            const av = a[sortBy];
            const bv = b[sortBy];
            if (av === bv) return 0;
            return av > bv ? sortOrder : -sortOrder;
          });
        }

        const total = results.length;
        const limit = (filters && filters.limit) || 10;
        const page = (filters && filters.page) || 1;
        const totalPages = Math.max(1, Math.ceil(total / limit));
        const start = (page - 1) * limit;
        const pageData = results.slice(start, start + limit).map((r) => ({ ...r }));

        return {
          data: pageData,
          pagination: { page, limit, total, totalPages }
        };
      })
    );
  }

  getCtcById(id: string): Observable<any> {
    return this.loadCtcs().pipe(
      map((all) => {
        const found = all.find((r) => r.id === id);
        if (!found) {
          throw { error: { error: 'CTC record not found' } };
        }
        return { ...found };
      })
    );
  }

  createCtc(data: any): Observable<any> {
    return this.loadCtcs().pipe(
      map((all) => {
        const now = new Date().toISOString();
        const newRecord = {
          id: `ctc-${Date.now()}`,
          isActive: data.status === 'ACTIVE',
          createdBy: 'current-user',
          createdAt: now,
          modifiedBy: 'current-user',
          updatedAt: now,
          employeeCount: 0,
          ...data
        };
        all.push(newRecord);
        return { ...newRecord };
      })
    );
  }

  updateCtc(id: string, data: any): Observable<any> {
    return this.loadCtcs().pipe(
      map((all) => {
        const idx = all.findIndex((r) => r.id === id);
        if (idx === -1) {
          throw { error: { error: 'CTC record not found' } };
        }
        const updated = {
          ...all[idx],
          ...data,
          isActive: data.status ? data.status === 'ACTIVE' : all[idx].isActive,
          modifiedBy: 'current-user',
          updatedAt: new Date().toISOString()
        };
        all[idx] = updated;
        return { ...updated };
      })
    );
  }

  patchCtcStatus(id: string, status: string): Observable<any> {
    return this.loadCtcs().pipe(
      map((all) => {
        const idx = all.findIndex((r) => r.id === id);
        if (idx === -1) {
          throw { error: { error: 'CTC record not found' } };
        }
        all[idx] = { ...all[idx], status, isActive: status === 'ACTIVE', updatedAt: new Date().toISOString() };
        return { ...all[idx] };
      })
    );
  }

  deleteCtc(id: string): Observable<any> {
    return this.loadCtcs().pipe(
      map((all) => {
        const idx = all.findIndex((r) => r.id === id);
        if (idx !== -1) {
          all.splice(idx, 1);
        }
        return { success: true };
      })
    );
  }

  // --- Nested Subcategory APIs (Category master) --------------------------

  addSubCategory(categoryId: string, name: string): Observable<SubCategoryRecord> {
    return this.loadMasterType('category').pipe(
      map((list) => {
        const category = list.find((r) => r.id === categoryId);
        if (!category) {
          throw { error: { error: 'Category not found' } };
        }
        const newSub: SubCategoryRecord = {
          id: `subcat-${Date.now()}`,
          categoryId,
          name,
          createdAt: new Date().toISOString()
        };
        category.subCategories = [...(category.subCategories || []), newSub];
        return { ...newSub };
      })
    );
  }

  updateSubCategory(categoryId: string, subCategoryId: string, name: string): Observable<SubCategoryRecord> {
    return this.loadMasterType('category').pipe(
      map((list) => {
        const category = list.find((r) => r.id === categoryId);
        if (!category || !category.subCategories) {
          throw { error: { error: 'Sub-category not found' } };
        }
        const idx = category.subCategories.findIndex((s) => s.id === subCategoryId);
        if (idx === -1) {
          throw { error: { error: 'Sub-category not found' } };
        }
        const updated = { ...category.subCategories[idx], name };
        category.subCategories[idx] = updated;
        return { ...updated };
      })
    );
  }

  deleteSubCategory(categoryId: string, subCategoryId: string): Observable<any> {
    return this.loadMasterType('category').pipe(
      map((list) => {
        const category = list.find((r) => r.id === categoryId);
        if (category && category.subCategories) {
          category.subCategories = category.subCategories.filter((s) => s.id !== subCategoryId);
        }
        return { success: true };
      })
    );
  }
}
