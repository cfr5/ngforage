import {Injectable, Provider} from '@angular/core';
import {TestBed} from '@angular/core/testing';
import 'localforage';
import {cloneDeep, forEach} from 'lodash-es';
import {def} from '../../test.def';
import {Driver as D} from '../misc/driver.enum';
import {BaseConfigurable} from './base-configurable';
import {BaseConfigurableImpl} from './base-configurable-impl.service';
import {NgForageConfig} from './ng-forage-config.service';
import {NgForageOptions} from './ng-forage-options';

describe('BaseConfigurableImpl', () => {

  @Injectable()
  class BC extends BaseConfigurableImpl {

    public getStore(): LocalForage {
      return this.store;
    }
  }

  let conf: NgForageConfig;
  let defaults: NgForageOptions;
  let bc: BC;

  afterEach(() => {
    conf.configure(cloneDeep(defaults));
  });

  beforeEach(() => {
    const stdConfig = cloneDeep(def);
    (<Provider[]>stdConfig.providers).push(BC);
    TestBed.configureTestingModule(stdConfig);

    conf = TestBed.inject(NgForageConfig);
    defaults = cloneDeep(conf.config);

    bc = TestBed.inject(BC);
  });

  it('toString() should be a JSON.stringify', () => {
    expect(bc.toString()).toEqual(JSON.stringify(bc));
  });

  describe('get/set', () => {
    const tests: Partial<Record<keyof BaseConfigurable, any>> = {
      description: ['foo', 'bar'],
      driver: ['foo', 'bar'],
      name: ['foo', 'bar'],
      size: [1, 2],
      storeName: ['foo', 'bar'],
      version: [1, 2]
    };

    for (const [k, v] of Object.entries(tests) as [keyof BaseConfigurable, any]) {
      describe(k, () => {
        describe('@cfg', () => {
          beforeEach(() => {
            (conf as any)[k] = v[0];
          });

          it('via getter', () => {
            expect((bc as any)[k]).toBe(v[0]);
          });

          it('via JSON', () => {
            expect((bc as any).toJSON()[k]).toBe(v[0]);
          });
        });

        describe('@instance', () => {
          beforeEach(() => {
            (conf as any)[k] = v[0];
            (bc as any)[k] = v[1];
          });

          it('via getter', () => {
            expect((bc as any)[k]).toBe(v[1]);
          });

          it('via JSON', () => {
            expect((bc as any).toJSON()[k]).toBe(v[1]);
          });
        });
      });
    }
  });

  describe('#storeNeedsRecalc', () => {
    let inst1: LocalForage;
    let inst2: LocalForage;
    let inst3: LocalForage;

    it('Passing a falsy value to configure() shouldn\'t cause trouble', () => {
      const conf1 = bc.toJSON();
      const ret = bc.configure(<any>undefined);
      const conf2 = bc.toJSON();

      expect(conf1).toEqual(conf2, 'Equality');
      expect(ret).toBe(bc, 'Same obj');
    });

    function initInst1() {
      bc.configure({driver: [D.LOCAL_STORAGE, D.INDEXED_DB]});
      inst1 = bc.getStore();

      return inst1;
    }

    function initInst2() {
      bc.configure({driver: D.LOCAL_STORAGE});
      inst2 = bc.getStore();

      return inst2;
    }

    function initInst3() {
      bc.driver = D.LOCAL_STORAGE;
      inst3 = bc.getStore();

      return inst3;
    }

    it('Configuring a driver should set the array appropriately', () => {
      initInst1();
      expect(bc.driver).toEqual([D.LOCAL_STORAGE, D.INDEXED_DB]);
    });

    it('Configuring a driver with just one value should do the same', () => {
      initInst2();

      expect(bc.driver).toBe(D.LOCAL_STORAGE);
    });

    it('Setting driver via setter should achieve the same', () => {
      initInst3();

      expect(bc.driver).toBe(D.LOCAL_STORAGE);
    });

    describe('Driver equalities', () => {
      it('1 !== 2', () => {
        expect(initInst1()).not.toBe(initInst2());
      });

      it('1 !== 3', () => {
        expect(initInst1()).not.toBe(initInst3());
      });

      it('2 === 3', () => {
        expect(initInst2()).toBe(initInst3());
      });
    });
  });
});
