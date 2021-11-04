// Source:
https://github.com/b31zakx96/vaccination-choropleth-french/blob/main/src/components/Map.vue
<template>
  <div class="map">
    <l-map
      ref="mymap"
      :center="[46.71109, 1.7191036]"
      :zoom="6"
      :minZoom="6"
      :options="mapOptions"
    >
      <l-control-scale
        position="bottomleft"
        :imperial="true"
        :metric="true"
      ></l-control-scale>

      <l-tile-layer
        v-for="tileProvider in tileProviders"
        :key="tileProvider.name"
        :name="tileProvider.name"
        :visible="tileProvider.visible"
        :url="tileProvider.url"
        :attribution="tileProvider.attribution"
        layer-type="base"
      />

      <l-choropleth-layer
        v-if="checkedChorop == true"
        :data="getData()"
        titleKey="name"
        idKey="id"
        :value="value"
        :extraValues="extraValues"
        geojsonIdKey="code"
        :geojson="getGeojson()"
        :colorScale="colorScale"
        :currentStrokeColor="currentStrokeColor"
      >
        <template slot-scope="props">
          <l-info-control
            :item="props.currentItem"
            :unit="props.unit"
            title="Pourcentage de la population vaccinée"
            :placeholder="placeholderchoro"
            position="bottomright"
          />
          <l-reference-chart
            title="Vaccination Statistics"
            :colorScale="colorScale"
            :min="props.min"
            :max="props.max"
            position="topleft"
          />
        </template>
      </l-choropleth-layer>

      <l-marker
        :key="index"
        v-for="(vaxMarker, index) in vaxMarkers"
        :lat-lng="vaxMarker"
        @click="setInfoMarker(vaxMarker)"
      >
        <l-popup>
          <p class="text-center">
            <strong>{{ infoMarker.c_nom }}</strong>
          </p>
        </l-popup>
      </l-marker>
    </l-map>

    <b-sidebar
      width="380px"
      v-model="active"
      id="sidebar-no-header"
      title="COVID-19 l Vaccination Infos"
      shadow
    >
      <div class="p-3">
        <p><b>Sélectionnez une option pour l'affichage de choroplèthe :</b></p>
        <v-col class="d-flex center" cols="12" sm="12">
          <b-form-select
            v-model="selected"
            :options="options"
          ></b-form-select> </v-col
        ><br />

        <b-form-checkbox v-model="checkedChorop" name="check-button" switch>
          Afficher la choroplèthe
        </b-form-checkbox>

        <b-form-checkbox v-model="checked" name="check-button" switch>
          Trouver les centres de vaccination
        </b-form-checkbox>
      </div>

      <div class="p-3" v-if="checked == true">
        <p><b>Entrer le code postal de la ville que vous souhaitez:</b></p>

        <v-col class="d-flex center" cols="12" sm="10">
          <vue-bootstrap-typeahead
            ref="inputAutocomplete"
            v-model="zipCode"
            @input="getSuggestedZipCode"
            :data="SuggestedZipCode"
            placeholder="67000..."
          />

          <b-button
            rounded
            id="search_botton"
            @click="checkInput"
            class="mb-2"
            variant="outline-primary"
          >
            <b-icon icon="search"></b-icon>
          </b-button>

          <b-button
            rounded
            id="delete_botton"
            @click="deleteMarkers"
            class="mb-2"
            variant="outline-danger"
          >
            <b-icon icon="trash"></b-icon>
          </b-button> </v-col
        ><br />
        <b-list-group v-if="showMarkerInfo == true">
          <b-list-group-item class="text-center" variant="primary" button>
            <strong> {{ infoMarker.c_nom }} </strong>
          </b-list-group-item>
          <b-list-group-item button>
            <b>Adresse: </b>{{ infoMarker.c_adr_num }}
            {{ infoMarker.c_adr_voie }}, {{ infoMarker.c_com_cp }}
            {{ infoMarker.c_com_nom }}<br />
            <b>Rendez-vous: </b> {{ bool }} <br />
            <b>Tel: </b>{{ infoMarker.c_rdv_tel }} <br />
            <b>Site: </b>
            <a :href="infoMarker.c_rdv_site_web" target="_blank"
              >Visite le site!</a
            ><br />
            <b-list-group-item button>
              <b>Lundi: </b>{{ infoMarker.c_rdv_lundi }}<br />
              <b>Mardi: </b>{{ infoMarker.c_rdv_mardi }} <br />
              <b>Mercredi: </b>{{ infoMarker.c_rdv_mercredi }} <br />
              <b>Jeudi: </b>{{ infoMarker.c_rdv_jeudi }}<br />
              <b>Vendredi: </b>{{ infoMarker.c_rdv_vendredi }} <br />
              <b>Samedi: </b>{{ infoMarker.c_rdv_samedi }} <br />
              <b>Dimanche: </b>{{ infoMarker.c_rdv_dimanche }} <br />
            </b-list-group-item>
          </b-list-group-item>
        </b-list-group>
      </div>

      <template v-slot:footer>
        <div class="d-flex bg-light text-dark align-items-center px-3 py-2">
          <b-button variant="primary" block @click="closeSidebar"
            >Fermer</b-button
          >
        </div>
      </template>
    </b-sidebar>

    <v-btn class="mx-2" fab small fixed top right @click="goHome">
      <v-icon>mdi-home</v-icon>
    </v-btn>

    <v-btn
      id="btn-param"
      class="mx-2"
      fab
      small
      fixed
      top
      right
      @click="showSidebar()"
    >
      <v-icon>mdi-wrench</v-icon>
    </v-btn>

    <v-btn
      id="btn-view"
      class="mx-2"
      fab
      small
      fixed
      top
      right
      @click="resetView"
    >
      <v-icon>mdi-eye</v-icon>
    </v-btn>
  </div>
</template>

<script>
import { InfoControl, ReferenceChart, ChoroplethLayer } from "vue-choropleth";

import L from "leaflet";

import frRegionGeojson from "../data/france-regions.json";
import frDepartmentGeojson from "../data/france-departments.json";
import { frRegionData } from "../data/france-regions-data";
import { frDepartmentData } from "../data/france-departments-data";
import frCentresVax from "../data/centres-vaccination.json";

import {
  LMap,
  LPopup,
  LMarker,
  LTileLayer,
  LControlLayers,
  LControlScale
} from "vue2-leaflet";

export default {
  name: "Map",
  data: function () {
    return {
      frRegionData,
      frDepartmentData,
      frRegionGeojson,
      frDepartmentGeojson,
      frCentresVax,

      colorScale: ["F4D03F", "85C1E9", "4A235A"],
      extraValues: [
        {
          key: "percent_vax_complet",
          metric: "% de la population ayant reçu au moins une dose"
        }
      ],
      value: {
        key: "percent_vax_dose1",
        metric: "% de la population est pleinement vaccinée"
      },
      mapOptions: {
        attributionControl: false,
        zoomControl: false
      },
      currentStrokeColor: "D35400",
      placeholderchoro: "Passez la souris sur un département",
      selected: "department",
      checked: false,
      checkedChorop: true,
      zipCode: null,
      options: [
        { value: "region", text: "Par Région" },
        { value: "department", text: "Par Département" }
      ],
      active: false,
      tileProviders: [
        {
          name: "OpenStreetMap",
          visible: true,
          url: "https://tiles.stadiamaps.com/tiles/alidade_smooth/{z}/{x}/{y}{r}.png",
          attribution:
            '&copy; <a target="_blank" href="http://osm.org/copyright">OpenStreetMap</a> contributors'
        }
      ],
      bounds: null,
      infoMarker: {},
      bool: false,
      showMarkerInfo: false,
      SuggestedZipCode: [],
      vaxMarkers: []
    };
  }, //data

  components: {
    LMap,
    LMarker,
    LPopup,
    LTileLayer,
    LControlScale,
    LControlLayers,
    "l-info-control": InfoControl,
    "l-reference-chart": ReferenceChart,
    "l-choropleth-layer": ChoroplethLayer
  }, //components

  mounted() {
    this.$nextTick(() => {
      this.resetView();
    });
  }, //mounted

  methods: {
    deleteMarkers() {
      this.vaxMarkers = [];
      this.zipCode = "";
      this.$refs.inputAutocomplete.inputValue = "";
      this.showMarkerInfo = false;
    },

    setInfoMarker(marker) {
      this.infoMarker = this.frCentresVax.features[marker.id].properties;
      this.showMarkerInfo = true;
      this.showSidebar();
      if (this.infoMarker.c_rdv == true) {
        this.bool = "Oui";
      } else {
        this.bool = "Non";
      }
      console.log(this.infoMarker);
    },

    getSuggestedZipCode() {
      var data = this.frCentresVax.features;
      for (let i = 0; i < data.length; i++) {
        this.SuggestedZipCode.push(data[i].properties.c_com_cp);
      }
      this.SuggestedZipCode = [...new Set(this.SuggestedZipCode)];
    },

    checkInput() {
      this.vaxMarkers = [];
      this.showMarkerInfo = false;
      var data = this.frCentresVax.features;
      for (let i = 0; i < data.length; i++) {
        if (data[i].properties.c_com_cp == this.zipCode) {
          const newMarker = {
            lat: data[i].properties.c_lat_coor1,
            lng: data[i].properties.c_long_coor1,
            id: i
          };
          this.vaxMarkers.push(newMarker);
        }
      }
      var markerBounds = [];
      for (var i = 0; i < this.vaxMarkers.length; i++) {
        markerBounds.push(
          L.marker([this.vaxMarkers[i].lat, this.vaxMarkers[i].lng])
        );
      }
      var group = L.featureGroup(markerBounds);
      this.$refs.mymap.mapObject.fitBounds(group.getBounds(), {
        padding: [20, 20]
      });
    },

    getData() {
      if (this.selected == "region") {
        this.placeholderchoro = "Passez la souris sur une région";
        return this.frRegionData;
      }
      if (this.selected == "department") {
        this.placeholderchoro = "Passez la souris sur un département";
        return this.frDepartmentData;
      }
    },
    getGeojson() {
      if (this.selected == "region") {
        return this.frRegionGeojson;
      }
      if (this.selected == "department") {
        return this.frDepartmentGeojson;
      }
    },
    resetView() {
      this.$refs.mymap.mapObject.setView([46.71109, 1.7191036], 6.35);
    },

    showSidebar() {
      this.active = true;
    },

    closeSidebar() {
      this.active = false;
      //this.resetView()
    },

    goHome() {
      this.$router.push({ path: "/" });
    }
  }
}; //export default
</script>

<!--  style  -->

<style scoped>
@import "../../node_modules/leaflet/dist/leaflet.css";

.map {
  height: 100%;
  width: 100%;
  position: absolute;
  top: 0;
  left: 0;
  z-index: 0;
}

.v-btn {
  z-index: 1000;
  right: 0px;
}

#btn-view {
  margin-top: 48px;
}

#btn-param {
  margin-top: 96px;
}
</style>
