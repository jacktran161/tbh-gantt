/*
*  Power BI Visual CLI
*
*  Copyright (c) Microsoft Corporation
*  All rights reserved.
*  MIT License
*
*  Permission is hereby granted, free of charge, to any person obtaining a copy
*  of this software and associated documentation files (the ''Software''), to deal
*  in the Software without restriction, including without limitation the rights
*  to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
*  copies of the Software, and to permit persons to whom the Software is
*  furnished to do so, subject to the following conditions:
*
*  The above copyright notice and this permission notice shall be included in
*  all copies or substantial portions of the Software.
*
*  THE SOFTWARE IS PROVIDED *AS IS*, WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
*  IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
*  FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
*  AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
*  LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
*  OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
*  THE SOFTWARE.
*/

'use strict';


////////////////////////////////////////////////////////////////
//  Imports
////////////////////////////////////////////////////////////////

import './../style/visual.less';
import powerbi from 'powerbi-visuals-api';
import VisualConstructorOptions = powerbi.extensibility.visual.VisualConstructorOptions;
import VisualUpdateOptions = powerbi.extensibility.visual.VisualUpdateOptions;
import IVisual = powerbi.extensibility.visual.IVisual;
import DataView = powerbi.DataView;

//import { VisualSettings } from './settings';

import EnumerateVisualObjectInstancesOptions = powerbi.EnumerateVisualObjectInstancesOptions;
import VisualObjectInstance = powerbi.VisualObjectInstance;
import VisualObjectInstanceEnumerationObject = powerbi.VisualObjectInstanceEnumerationObject;

import IVisualHost = powerbi.extensibility.IVisualHost;
import * as d3 from 'd3';
import { DSVRowAny, schemeSet3, style, text } from 'd3';
type Selection<T extends d3.BaseType> = d3.Selection<T, any, any, any>;


////////////////////////////////////////////////////////////////
//  Begin class definition
////////////////////////////////////////////////////////////////

export class Visual implements IVisual {


    ////////////////////////////////////////////////////////////////
    //  Define members
    ////////////////////////////////////////////////////////////////

    // private target: HTMLElement;
    // private updateCount: number;
    // private settings: VisualSettings;
    // private textNode: Text;

    private host: IVisualHost;
    private body: Selection<any>;

    //divs
    private divHeader: Selection<HTMLDivElement>;
    private divContent: Selection<HTMLDivElement>;
    private statusAndContent: Selection<HTMLDivElement>;
    private divTimelineAndActivitiesH: Selection<HTMLDivElement>;
    private divStatusLine: Selection<HTMLDivElement>;
    private divActivities: Selection<HTMLDivElement>;
    private divChartContainer: Selection<HTMLDivElement>;
    private divStructureLayer: Selection<HTMLDivElement>;
    private divSvgLayer: Selection<HTMLDivElement>;
    private divTimeline: Selection<HTMLDivElement>;
    private divChart: Selection<HTMLDivElement>;
    private divOverlay: Selection<HTMLDivElement>;

    //tables

    private activityTable: Selection<any>;
    private timelineTable: Selection<HTMLTableElement>;
    private ganttGridTable: Selection<HTMLTableElement>;

    //svgs

    //text
    private svg: Selection<SVGElement>;

    private container: Selection<SVGElement>;
    private circle: Selection<SVGElement>;
    private textValue: Selection<SVGElement>;
    private textLabel: Selection<SVGElement>;


    ////////////////DEV VARS\\\\\\\\\\\\\\\\
    private rows: number;
    private cols: number;


    ////////////////////////////////////////////////////////////////
    //  Constructor
    ////////////////////////////////////////////////////////////////

    constructor(options: VisualConstructorOptions) {
        console.log('Visual constructor', options);

        //     this.target = options.element;
        //     this.updateCount = 0;
        //     if (document) {
        //         const new_p: HTMLElement = document.createElement('p');
        //         new_p.appendChild(document.createTextNode('Update count:'));
        //         const new_em: HTMLElement = document.createElement('em');
        //         this.textNode = document.createTextNode(this.updateCount.toString());
        //         new_em.appendChild(this.textNode);
        //         new_p.appendChild(new_em);
        //         this.target.appendChild(new_p);
        //      }

        // help from lines 377 onwards at https://github.com/microsoft/powerbi-visuals-gantt/blob/master/src/gantt.ts


        ////////////////////////////////////////////////////////////////
        //  Create body level child elements
        ////////////////////////////////////////////////////////////////

        //the header including title, logos etc
        this.divHeader = d3.select(options.element)
            .append('div')
            .attr('id', 'div-header')
            .append('h4')
            .text('Header (include space for title, legend & logos');

        //structure of the content below the header
        this.statusAndContent = d3.select(options.element)
            .append('div')
            .attr('id', 'div-statusAndContent');


        ////////////////////////////////////////////////////////////////
        //  Create elements under the header
        ////////////////////////////////////////////////////////////////

        //"header of the gantt chart" containing the activity field headers and timeline
        this.divTimelineAndActivitiesH = this.statusAndContent
            .append('div')
            .attr('id', 'div-timelineAndActivitiesHeader');

        //div to contain the act table and chart
        this.divContent = this.statusAndContent
            .append('div')
            .attr('id', 'div-content');

        //overlapping div to contain the status line
        this.divStatusLine = this.statusAndContent
            .append('div')
            .attr('id', 'div-statusLine');

        ////////////////////////////////////////////////////////////////
        //  Create content elements
        ////////////////////////////////////////////////////////////////

        //div to hold the activity data in a table
        this.divActivities = this.divContent
            .append('div')
            .attr('id', 'div-activities');

        //div to hold the chart elements including background, bars, text, controls
        this.divChartContainer = this.divContent
            .append('div')
            .attr('id', 'div-chartContainer');

        //the structure layer of the chart (grid, shading)
        this.divStructureLayer = this.divChartContainer
            .append('div')
            .attr('class', 'gridStack')
            .attr('id', 'div-structureLayer');

        //the svg layer  of the chart (bars, links)
        this.divSvgLayer = this.divChartContainer
            .append('div')
            .attr('class', 'gridStack')
            .attr('id', 'div-svgLayer');

        //div in the header that contains the timeline


        this.divTimelineAndActivitiesH.append('table')
            .attr('id', 'table-activityHeader')
            .append('th')
            .text("Activity Header");

        this.divTimeline = this.divTimelineAndActivitiesH
            .append('div')
            .attr('id', 'div-timeline');

        // this.divTimeline.text('Timeline goes here and this line gets realllllllllllly long to demonstrate the overflow-x setting for long timelines.');

        //the div that needs more justification for its existence.
        this.divChart = this.divStructureLayer
            .append('div')
            .attr('id', 'div-chart')
            .attr('class', 'highlight');

        ////////////////////////////////////////////////////////////////
        //  Create svg timeline
        ////////////////////////////////////////////////////////////////


        var egsvg = this.divTimeline
            .append('g').classed('g-tl',true).append('svg')
            .attr('width', '900px')
            .attr('height', '100%');

        egsvg.append('text')
            .attr('x', '0px')
            .attr('y', '0px')
            .text('dd-mm-yyyy')
            .attr('text-anchor', 'top')
            .attr('alignment-baseline','hanging')
            .attr('fill','#111111');

        // egsvg.append('rect')
        //     .classed('activityBar', true)
        //     .attr('height', '100%')
        //     .attr('width', '100%')
        //     .attr('x', '0px')
        //     .attr('y', '0px')
        //     .attr('rx', '3px')
        //     .attr('ry', '3px');

        ////////////////////////////////////////////////////////////////
        //  Create #table-activities
        ////////////////////////////////////////////////////////////////
        // https://stackoverflow.com/questions/43356213/understanding-enter-and-exit
        // https://www.tutorialsteacher.com/d3js/function-of-data-in-d3js
        // https://stackoverflow.com/questions/21485981/appending-multiple-non-nested-elements-for-each-data-member-with-d3-js/33809812#33809812
        // https://stackoverflow.com/questions/37583275/how-to-append-multiple-child-elements-to-a-div-in-d3-js?noredirect=1&lq=1
        // https://stackoverflow.com/questions/21485981/appending-multiple-non-nested-elements-for-each-data-member-with-d3-js

        this.activityTable = this.divActivities
            .append('table')
            .attr('id', 'table-activities');

        let keys: string[] = ['Activity A', '01/03/22', '25/06/22'];
        let values1: string[] = ['Activity B', '01/03/22', '25/06/22'];
        let values2: string[] = ['Activity C', '01/03/22', '25/06/22'];
        let values3: string[] = ['Activity D', '01/03/22', '25/06/22'];
        let values4: string[] = ['Activity E', '01/03/22', '25/06/22'];
        let values5: string[] = ['Activity F', '01/03/22', '25/06/22'];
        let values6: string[] = ['Activity G', '01/03/22', '25/06/22'];
        let myData: string[][] = [keys, values1, values2, values3, values4, values5, values6];

        this.populateActivityTable(myData, null, 'table-activities');

        ////////////////////////////////////////////////////////////////
        //  Prepare for chart drawing
        ////////////////////////////////////////////////////////////////

        //find the dimensions of the containers. Specifically the timeline and svg area.

        let timelineWidth: number = (this.divSvgLayer.node() as HTMLDivElement).getBoundingClientRect().width;
        let timelineHeight: number = (this.divSvgLayer.node() as HTMLDivElement).getBoundingClientRect().height;

        let chartWidth: number = (this.divChart.node() as HTMLDivElement).getBoundingClientRect().width;
        let chartHeight: number = (this.divChart.node() as HTMLDivElement).getBoundingClientRect().height;

        let style = getComputedStyle(document.querySelector(':root'));

        let rowHeight: string = style.getPropertyValue('--rowHeight');

        let bars: Selection<SVGSVGElement> = d3.select('#div-chart')
            .append('g')
            .append('svg')
            .attr('id', 'svg-bars');

        bars.append('rect')
            .classed('activityBar', true)
            .attr('height', rowHeight)
            .attr('width', '90px')
            .attr('x', '0px')
            .attr('y', '0px')
            .attr('rx', '3px')
            .attr('ry', '3px');

        bars.append('rect')
            .classed('activityBar', true)
            .attr('height', rowHeight)
            .attr('width', '50px')
            .attr('x', '100px')
            .attr('y', rowHeight)
            .attr('rx', '3px')
            .attr('ry', '3px');

        bars.append('rect')
            .classed('activityBar', true)
            .attr('height', rowHeight)
            .attr('width', '50px')
            .attr('x', '80px')
            .attr('y', '80px')
            .attr('rx', '3px')
            .attr('ry', '3px');


        ////////////////////////////////////////////////////////////////
        //  Draw chart
        ////////////////////////////////////////////////////////////////

        //also put this in a fn later for update()
        // getBBox() help here:
        // https://stackoverflow.com/questions/45792692/property-getbbox-does-not-exist-on-type-svgelement
        // https://stackoverflow.com/questions/24534988/d3-get-the-bounding-box-of-a-selected-element
        this.divStatusLine.append('svg')
            .attr('id', 'statusLine').attr('width', '100%').attr('height', '100%')
            .append('line')
            .attr('x1', '0px')
            .attr('y1', '0px')
            .attr('x2', '0px')
            .attr('y2', (d3.select('#div-statusLine').node() as HTMLDivElement)
                .getBoundingClientRect()
                .height
                .toString()
                .concat('px'))
            .attr('transform', 'translate(30)');




    }

    /*
    * Returns a <table> element based on the Activities from the DataView.
    * Returns an empty table if options is null.
    */
    private populateActivityTable(data: string[][], headerID: string, tableID: string) {
        //check number of data elements and number of tr and tds to determine
        //whether to enter(), update() or exit()

        if (data == null) {
            console.log('LOG: populateActivityTable called with a null VisualUpdateOptions.');

        }

        //https://www.tutorialsteacher.com/d3js/data-binding-in-d3js
        //https://www.dashingd3js.com/d3-tutorial/use-d3-js-to-bind-data-to-dom-elements
        //BEWARE: I had to change the types of all these following to var and not Selection<T,T,T,T>. the second function (d)
        //call returned a type that wasnt compatible with Selction<T,T,T,T> and I couldn't figure out which type to use.

        console.log('LOG: populateActivityTable called with some number of rows.');

        //create the number of trs required.
        var tr = d3.select('#' + tableID)//select the table
            .selectAll('tr')//select all tr elements (which there are none)
            .data(data)//select every array element of array myData (there are 3). DATA IS NOW BOUND TO TRs
            .enter()//since we have 0 trs and 3 elements in myData, we stage 3 references
            .append('tr');//append a tr to each reference

        var v = tr.selectAll('td')//select all tds, there are 0
            .data(function (d) { return d; })//THIS DATA COMES FROM THE TR's _data_ PROPERTY
            .enter()
            .append('td')
            .text(function (d) { return d; });//we are taking d from the bound data from the trs
    }


    public update(options: VisualUpdateOptions) {
        //this.settings = Visual.parseSettings(options && options.dataViews && options.dataViews[0]);
        console.log('Visual update', options);
        // if (this.textNode) {
        //     this.textNode.textContent = (this.updateCount++).toString();
        // }

        let dataView: DataView = options.dataViews[0];

        // let width: number = options.viewport.width;
        // let height: number = options.viewport.height;
        // this.svg.attr('width', width);
        // this.svg.attr('height', height);
        // let radius: number = Math.min(width, height) / 2.2;
        // this.circle
        //     .style('fill', 'white')
        //     .style('fill-opacity', 0.5)
        //     .style('stroke', 'black')
        //     .style('stroke-width', 2)
        //     .attr('r', radius)
        //     .attr('cx', width / 2)
        //     .attr('cy', height / 2);
        // let fontSizeValue: number = Math.min(width, height) / 5;
        // this.textValue
        //     .text(<string>dataView.single.value)
        //     .attr('x', '50%')
        //     .attr('y', '50%')
        //     .attr('dy', '0.35em')
        //     .attr('text-anchor', 'middle')
        //     .style('font-size', fontSizeValue + 'px');
        // let fontSizeLabel: number = fontSizeValue / 4;
        // this.textLabel
        //     .text(dataView.metadata.columns[0].displayName)
        //     .attr('x', '50%')
        //     .attr('y', height / 2)
        //     .attr('dy', fontSizeValue / 1.2)
        //     .attr('text-anchor', 'middle')
        //     .style('font-size', fontSizeLabel + 'px');

    }
}