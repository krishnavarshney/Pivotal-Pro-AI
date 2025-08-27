import { Template, FieldType, ChartType, AggregationType } from './types';

export const SAMPLE_DATA_SALES = `Row ID,Order ID,Order Date,Ship Date,Ship Mode,Customer ID,Customer Name,Segment,Country,City,State,Postal Code,Region,Product ID,Category,Sub-Category,Product Name,Sales,Quantity,Discount,Profit
1,CA-2016-152156,11/8/2016,11/11/2016,Second Class,CG-12520,Claire Gute,Consumer,United States,Henderson,Kentucky,42420,South,FUR-BO-10001798,Furniture,Bookcases,"Bush Somerset Collection Bookcase",261.96,2,0,41.9136
2,CA-2016-152156,11/8/2016,11/11/2016,Second Class,CG-12520,Claire Gute,Consumer,United States,Henderson,Kentucky,42420,South,FUR-CH-10000454,Furniture,Chairs,"Hon Deluxe Fabric Upholstered Stacking Chairs, Rounded Back",731.94,3,0,219.582
3,CA-2016-138688,6/12/2016,6/16/2016,Second Class,DV-13045,Darrin Van Huff,Corporate,United States,Los Angeles,California,90032,West,OFF-LA-10000240,Office Supplies,Labels,"Self-Adhesive Address Labels for Typewriters by Universal",14.62,2,0,6.8714
4,US-2015-108966,10/11/2015,10/18/2015,Standard Class,SO-20335,Sean O'Donnell,Consumer,United States,Fort Lauderdale,Florida,33311,South,FUR-TA-10000577,Furniture,Tables,"Bretford CR4500 Series Slim Rectangular Table",957.5775,5,0.45,-383.031
5,US-2015-108966,10/11/2015,10/18/2015,Standard Class,SO-20335,Sean O'Donnell,Consumer,United States,Fort Lauderdale,Florida,33311,South,OFF-ST-10000760,Office Supplies,Storage,"Eldon Fold 'N Roll Cart System",22.368,2,0.2,2.5164
6,CA-2014-115812,6/9/2014,6/14/2014,Standard Class,BH-11710,Brosina Hoffman,Consumer,United States,Los Angeles,California,90032,West,FUR-FU-10001487,Furniture,Furnishings,"Eldon Expressions Wood Photo Frame, Mahogany",48.86,7,0,14.1694
7,CA-2014-115812,6/9/2014,6/14/2014,Standard Class,BH-11710,Brosina Hoffman,Consumer,United States,Los Angeles,California,90032,West,OFF-AR-10002833,Office Supplies,Art,"Newell 322",7.28,4,0,1.9656
8,CA-2014-115812,6/9/2014,6/14/2014,Standard Class,BH-11710,Brosina Hoffman,Consumer,United States,Los Angeles,California,90032,West,TEC-PH-10002275,Technology,Phones,"Mitel 5320 IP Phone VoIP phone",907.152,6,0.2,90.7152
9,CA-2014-115812,6/9/2014,6/14/2014,Standard Class,BH-11710,Brosina Hoffman,Consumer,United States,Los Angeles,California,90032,West,OFF-BI-10003910,Office Supplies,Binders,"DXL letter size triple pocket folders",18.504,3,0.2,5.7825
10,CA-2014-115812,6/9/2014,6/14/2014,Standard Class,BH-11710,Brosina Hoffman,Consumer,United States,Los Angeles,California,90032,West,OFF-AP-10002892,Office Supplies,Appliances,"Belkin F5C206VTEL 6 Outlet Surge",114.9,5,0,34.47
11,CA-2014-115812,6/9/2014,6/14/2014,Standard Class,BH-11710,Brosina Hoffman,Consumer,United States,Los Angeles,California,90032,West,FUR-TA-10001539,Furniture,Tables,"Chromcraft Rectangular Conference Tables",1706.184,9,0.2,85.3092
12,CA-2014-115812,6/9/2014,6/14/2014,Standard Class,BH-11710,Brosina Hoffman,Consumer,United States,Los Angeles,California,90032,West,TEC-PH-10002033,Technology,Phones,"Konftel 250 Conference phone - Charcoal black",911.424,4,0.2,68.3568
13,CA-2017-114412,4/15/2017,4/20/2017,Standard Class,AA-10480,Andrew Allen,Consumer,United States,Concord,North Carolina,28027,South,OFF-PA-10002365,Office Supplies,Paper,"Xerox 1967",15.552,3,0.2,5.4432
14,CA-2016-161389,12/5/2016,12/10/2016,Standard Class,IM-15070,Irene Maddox,Consumer,United States,Seattle,Washington,98103,West,OFF-BI-10003656,Office Supplies,Binders,"Fellowes PB200 Plastic Comb Binding Machine",407.976,3,0.2,132.5922
15,US-2015-118983,11/22/2015,11/26/2015,Standard Class,HP-14815,Harold Pawlan,Home Office,United States,Fort Worth,Texas,76106,Central,OFF-AP-10002311,Office Supplies,Appliances,"Holmes Replacement Filter for HEPA Air Cleaner, Pack of 3",68.81,5,0.8,-123.858
16,US-2015-118983,11/22/2015,11/26/2015,Standard Class,HP-14815,Harold Pawlan,Home Office,United States,Fort Worth,Texas,76106,Central,OFF-BI-10000756,Office Supplies,Binders,"Storex DuraTech Recycled Plastic Frosted Binders",2.544,3,0.8,-3.816
17,CA-2014-105893,11/11/2014,11/18/2014,Standard Class,PK-19075,Pete Kriz,Consumer,United States,Madison,Wisconsin,53711,Central,OFF-ST-10004186,Office Supplies,Storage,"Stur-D-Stor Shelving, Vertical 5-Shelf Document Storage",665.88,6,0,13.3176
18,CA-2014-167164,5/13/2014,5/15/2014,Second Class,AG-10270,Alejandro Grove,Consumer,United States,West Jordan,Utah,84084,West,OFF-ST-10000107,Office Supplies,Storage,"Fellowes Roll-A-File 3-Drawer Unit for Letter-Size Files",55.5,2,0,9.99
19,CA-2014-143336,8/27/2014,9/1/2014,Second Class,CK-12205,Chloris Kastensmidt,Consumer,United States,San Francisco,California,94109,West,OFF-AP-10002311,Office Supplies,Appliances,"Holmes Replacement Filter for HEPA Air Cleaner, Pack of 3",213.48,3,0,55.5048
20,CA-2014-143336,8/27/2014,9/1/2014,Second Class,CK-12205,Chloris Kastensmidt,Consumer,United States,San Francisco,California,94109,West,OFF-BI-10003274,Office Supplies,Binders,"Computer Printout Paper with Letter-Trim Perforations",32.96,4,0,15.1616
21,CA-2014-143336,8/27/2014,9/1/2014,Second Class,CK-12205,Chloris Kastensmidt,Consumer,United States,Philadelphia,Pennsylvania,19140,East,OFF-AP-10002892,Office Supplies,Appliances,"Belkin F5C206VTEL 6 Outlet Surge",114.9,5,0.2,34.47
22,CA-2016-137330,12/9/2016,12/13/2016,Standard Class,KB-16585,Ken Black,Corporate,United States,Fremont,Nebraska,68025,Central,OFF-AR-10000246,Office Supplies,Art,"Boston 16701 Electric Pencil Sharpener",19.46,7,0,5.0596
23,CA-2016-137330,12/9/2016,12/13/2016,Standard Class,KB-16585,Ken Black,Corporate,United States,Fremont,Nebraska,68025,Central,OFF-BI-10001597,Office Supplies,Binders,"Wilson Jones Active Use Binders",10.38,3,0,3.633
24,US-2017-156909,7/16/2017,7/18/2017,Second Class,SF-20065,Sandra Flanagan,Consumer,United States,Philadelphia,Pennsylvania,19140,East,FUR-CH-10002774,Furniture,Chairs,"Global Deluxe Stacking Chair, Gray",71.372,2,0.3,-1.0196
25,CA-2015-106320,9/25/2015,9/30/2015,Standard Class,EB-13870,Emily Burns,Consumer,United States,Orem,Utah,84058,West,FUR-TA-10000577,Furniture,Tables,"Bretford CR4500 Series Slim Rectangular Table",1044.63,3,0,240.2649
26,CA-2016-121755,1/16/2016,1/20/2016,Second Class,EH-13945,Eric Hoffmann,Consumer,United States,Los Angeles,California,90049,West,OFF-BI-10001634,Office Supplies,Binders,"Wilson Jones Active Use Binders",11.648,2,0.2,4.2224
27,CA-2016-121755,1/16/2016,1/20/2016,Second Class,EH-13945,Eric Hoffmann,Consumer,United States,Los Angeles,California,90049,West,TEC-AC-10003027,Technology,Accessories,"Imation 8GB Mini TravelDrive USB 2.0 Flash Drive",90.57,3,0,11.7741
28,US-2015-150630,9/17/2015,9/21/2015,Standard Class,TB-21520,Tracy Blumstein,Consumer,United States,Philadelphia,Pennsylvania,19140,East,FUR-BO-10004834,Furniture,Bookcases,"Sauder Facets Collection Library, Sky Alder Finish",3083.43,7,0.5,-1665.0522
29,US-2015-150630,9/17/2015,9/21/2015,Standard Class,TB-21520,Tracy Blumstein,Consumer,United States,Philadelphia,Pennsylvania,19140,East,OFF-BI-10000474,Office Supplies,Binders,"Avery Round Ring Poly Binders",9.616,2,0.7,-7.0518
30,US-2015-150630,9/17/2015,9/21/2015,Standard Class,TB-21520,Tracy Blumstein,Consumer,United States,Philadelphia,Pennsylvania,19140,East,FUR-FU-10004848,Furniture,Furnishings,"Linden 10"" Wall Clock With Oak Frame",124.2,3,0.2,12.42
31,US-2015-150630,9/17/2015,9/21/2015,Standard Class,TB-21520,Tracy Blumstein,Consumer,United States,Philadelphia,Pennsylvania,19140,East,OFF-EN-10001538,Office Supplies,Envelopes,"Cameo Buff Policy Envelopes",3.264,2,0.2,1.1424
32,US-2015-150630,9/17/2015,9/21/2015,Standard Class,TB-21520,Tracy Blumstein,Consumer,United States,Philadelphia,Pennsylvania,19140,East,OFF-AR-10004042,Office Supplies,Art,"BOSTON ShowBase Display Case",8.4,6,0.2,0.84
33,US-2015-150630,9/17/2015,9/21/2015,Standard Class,TB-21520,Tracy Blumstein,Consumer,United States,Philadelphia,Pennsylvania,19140,East,OFF-BI-10001525,Office Supplies,Binders,"GBC Premium Transparent Covers with Diagonal Lined Pattern",20.72,2,0.2,6.475
34,CA-2017-107727,10/19/2017,10/23/2017,Second Class,MA-17560,Matt Abelman,Home Office,United States,Houston,Texas,77095,Central,OFF-PA-10000249,Office Supplies,Paper,"Easy-staple paper",29.472,3,0.2,9.9468
35,CA-2016-117590,12/8/2016,12/10/2016,First Class,GH-14485,Gene Hale,Corporate,United States,Richardson,Texas,75080,Central,TEC-PH-10004977,Technology,Phones,"Mitel 5320 IP Phone VoIP phone",1097.544,7,0.2,123.4737
36,CA-2016-117590,12/8/2016,12/10/2016,First Class,GH-14485,Gene Hale,Corporate,United States,Richardson,Texas,75080,Central,OFF-BI-10004632,Office Supplies,Binders,"Laminated Locking Ring Binders",27.888,3,0.8,-46.0152
37,CA-2015-117415,12/27/2015,12/31/2015,Standard Class,SN-20710,Steve Nguyen,Home Office,United States,Houston,Texas,77041,Central,OFF-EN-10002986,Office Supplies,Envelopes,"Staple envelope",113.328,9,0.2,38.2482
38,CA-2015-117415,12/27/2015,12/31/2015,Standard Class,SN-20710,Steve Nguyen,Home Office,United States,Houston,Texas,77041,Central,OFF-AR-10003056,Office Supplies,Art,"Newell 351",11.76,4,0,3.0576
39,CA-2015-117415,12/27/2015,12/31/2015,Standard Class,SN-20710,Steve Nguyen,Home Office,United States,Houston,Texas,77041,Central,FUR-BO-10002545,Furniture,Bookcases,"Atlantic Metals Mobile 3-Shelf Bookcases, Custom Colors",532.3992,3,0.32,-46.9764
40,CA-2015-117415,12/27/2015,12/31/2015,Standard Class,SN-20710,Steve Nguyen,Home Office,United States,Houston,Texas,77041,Central,OFF-BI-10004390,Office Supplies,Binders,"GBC Wire Binding Strips",15.372,2,0.8,-25.2636
41,CA-2017-120999,9/10/2017,9/15/2017,Standard Class,LC-16930,Linda Cazamias,Corporate,United States,Naperville,Illinois,60540,Central,TEC-PH-10004093,Technology,Phones,"Cisco SPA 501G IP Phone",213.48,3,0,55.5048
42,CA-2016-101343,7/17/2016,7/22/2016,Standard Class,RA-19885,Ruben Ausman,Corporate,United States,Los Angeles,California,90049,West,OFF-ST-10003479,Office Supplies,Storage,"Eldon Base for stackable storage shelf, platinum",77.88,2,0,3.894
43,CA-2016-101343,7/17/2016,7/22/2016,Standard Class,RA-19885,Ruben Ausman,Corporate,United States,Los Angeles,California,90049,West,OFF-PA-10003312,Office Supplies,Paper,"Xerox 1993",17.94,3,0,8.073
44,CA-2017-139619,9/19/2017,9/23/2017,Standard Class,ES-14080,Erin Smith,Corporate,United States,Melbourne,Florida,32935,South,OFF-ST-10003282,Office Supplies,Storage,"Advantus 10-Drawer Portable Organizer, Chrome Metal Frame, Smoke Drawers",95.616,2,0.2,9.5616
45,CA-2016-118255,3/11/2016,3/13/2016,First Class,ON-18715,Odella Nelson,Corporate,United States,Eagan,Minnesota,55122,Central,TEC-AC-10003629,Technology,Accessories,"Imation Clip USB 2.0 4 GB Flash Drive",28.9,7,0,8.381
46,CA-2016-118255,3/11/2016,3/13/2016,First Class,ON-18715,Odella Nelson,Corporate,United States,Eagan,Minnesota,55122,Central,OFF-AP-10001492,Office Supplies,Appliances,"Acco 6 Outlet Guardian Basic Surge Suppressor",20.0,4,0,5.8
47,CA-2016-146703,10/20/2016,10/25/2016,Second Class,ER-13855,Elpida Rittenbach,Consumer,United States,Newark,Ohio,43055,East,OFF-BI-10001359,Office Supplies,Binders,"GBC DocuBind TL300 Electric Binding System",1110.16,4,0.7,-813.7824
48,CA-2016-146703,10/20/2016,10/25/2016,Second Class,ER-13855,Elpida Rittenbach,Consumer,United States,Newark,Ohio,43055,East,OFF-BI-10000756,Office Supplies,Binders,"Storex DuraTech Recycled Plastic Frosted Binders",3.798,3,0.7,-2.6187
49,CA-2015-155768,11/20/2015,11/24/2015,Standard Class,DK-13090,Don Kline,Consumer,United States,Los Angeles,California,90036,West,OFF-PA-10002041,Office Supplies,Paper,"SanDisk Cruzer 32 GB USB 2.0 Flash Drive",28.35,3,0,13.8915
50,CA-2015-155768,11/20/2015,11/24/2015,Standard Class,DK-13090,Don Kline,Consumer,United States,Los Angeles,California,90036,West,OFF-AR-10001257,Office Supplies,Art,"Newell 344",11.97,3,0,3.3516
51,CA-2015-139451,10/12/2015,10/16/2015,Standard Class,MM-17260,Magdelene Morse,Consumer,United States,Huntsville,Texas,77340,Central,OFF-BI-10002871,Office Supplies,Binders,"GBC Twin Loop Wire Binding Elements",25.824,6,0.8,-42.6096
52,CA-2015-139451,10/12/2015,10/16/2015,Standard Class,MM-17260,Magdelene Morse,Consumer,United States,Huntsville,Texas,77340,Central,TEC-AC-10002942,Technology,Accessories,"Memorex 25GB 6X Branded Blu-Ray Recordable Disc, 30/Pack",100.32,8,0.2,27.588
53,CA-2015-104269,3/12/2015,3/17/2015,Standard Class,DB-13060,Dave Brooks,Consumer,United States,Seattle,Washington,98115,West,OFF-PA-10004039,Office Supplies,Paper,"Xerox 1943",182.8,4,0,84.088
54,CA-2016-105816,12/11/2016,12/17/2016,Standard Class,JM-15265,Janet Molinari,Corporate,United States,New York City,New York,10024,East,OFF-FA-10000304,Office Supplies,Fasteners,"Advantus Push Pins",15.24,3,0,6.2484
55,CA-2016-105816,12/11/2016,12/17/2016,Standard Class,JM-15265,Janet Molinari,Corporate,United States,New York City,New York,10024,East,TEC-PH-10002824,Technology,Phones,"Jabra SPEAK 410",304.0,2,0,82.08
56,CA-2016-105816,12/11/2016,12/17/2016,Standard Class,JM-15265,Janet Molinari,Corporate,United States,New York City,New York,10024,East,OFF-AR-10001756,Office Supplies,Art,"Stanley Bostitch Contemporary Electric Pencil Sharpeners",40.92,6,0,11.0484
57,CA-2016-105816,12/11/2016,12/17/2016,Standard Class,JM-15265,Janet Molinari,Corporate,United States,New York City,New York,10024,East,OFF-PA-10000358,Office Supplies,Paper,"Adams Phone Message Book, Professional, 400 Message Capacity, 5 3/16"" x 11""",50.96,5,0,24.9704`;

export const SAMPLE_DATA_IRIS = `sepal.length,sepal.width,petal.length,petal.width,variety
5.1,3.5,1.4,0.2,Setosa
4.9,3,1.4,0.2,Setosa
4.7,3.2,1.3,0.2,Setosa
4.6,3.1,1.5,0.2,Setosa
5,3.6,1.4,0.2,Setosa
5.4,3.9,1.7,0.4,Setosa
4.6,3.4,1.4,0.3,Setosa
7,3.2,4.7,1.4,Versicolor
6.4,3.2,4.5,1.5,Versicolor
6.9,3.1,4.9,1.5,Versicolor
5.5,2.3,4,1.3,Versicolor
6.5,2.8,4.6,1.5,Versicolor
5.7,2.8,4.5,1.3,Versicolor
6.3,3.3,4.7,1.6,Versicolor
6.3,3.3,6,2.5,Virginica
5.8,2.7,5.1,1.9,Virginica
7.1,3,5.9,2.1,Virginica
6.3,2.9,5.6,1.8,Virginica
6.5,3,5.8,2.2,Virginica
7.6,3,6.6,2.1,Virginica`;


export const COLOR_PALETTES = {
    'Pivotal Pro': {
        colors: ['#4A47E5', '#00A8B5', '#F7B801', '#E54F6D', '#7A54C7', '#34D399', '#F97316'],
        bgColors: ['rgba(74, 71, 229, 0.6)', 'rgba(0, 168, 181, 0.6)', 'rgba(247, 184, 1, 0.6)', 'rgba(229, 79, 109, 0.6)', 'rgba(122, 84, 199, 0.6)', 'rgba(52, 211, 153, 0.6)', 'rgba(249, 115, 22, 0.6)'],
    },
    Vibrant: {
        colors: ['#ef4444', '#f59e0b', '#16a34a', '#3b82f6', '#8b5cf6', '#d946ef', '#14b8a6'],
        bgColors: ['rgba(239, 68, 68, 0.6)', 'rgba(245, 158, 11, 0.6)', 'rgba(22, 163, 74, 0.6)', 'rgba(59, 130, 246, 0.6)', 'rgba(139, 92, 246, 0.6)', 'rgba(217, 70, 239, 0.6)', 'rgba(20, 184, 166, 0.6)'],
    },
    Ocean: {
        colors: ['#0369a1', '#06b6d4', '#059669', '#3b82f6', '#4338ca', '#0891b2', '#047857'],
        bgColors: ['rgba(3, 105, 161, 0.6)', 'rgba(6, 182, 212, 0.6)', 'rgba(5, 150, 105, 0.6)', 'rgba(59, 130, 246, 0.6)', 'rgba(67, 56, 202, 0.6)', 'rgba(8, 145, 178, 0.6)', 'rgba(4, 120, 87, 0.6)'],
    },
    Forest: {
        colors: ['#166534', '#ca8a04', '#c2410c', '#15803d', '#a16207', '#9a3412', '#14532d'],
        bgColors: ['rgba(22, 101, 52, 0.6)', 'rgba(202, 138, 4, 0.6)', 'rgba(194, 65, 12, 0.6)', 'rgba(21, 128, 61, 0.6)', 'rgba(161, 98, 7, 0.6)', 'rgba(154, 52, 18, 0.6)', 'rgba(20, 83, 45, 0.6)'],
    },
     Corporate: {
        colors: ['#334155', '#64748b', '#4338ca', '#7e22ce', '#312e81', '#4a044e', '#0f172a'],
        bgColors: ['rgba(51, 65, 85, 0.6)', 'rgba(100, 116, 139, 0.6)', 'rgba(67, 56, 202, 0.6)', 'rgba(126, 34, 206, 0.6)', 'rgba(49, 46, 129, 0.6)', 'rgba(74, 4, 78, 0.6)', 'rgba(15, 23, 42, 0.6)'],
    },
};


export const DASHBOARD_TEMPLATES: Template[] = [
    {
        id: 'blank',
        name: 'Blank Canvas',
        description: 'Start with a clean slate and build your dashboard from scratch.',
        category: 'General',
        page: {},
        requiredFields: [],
        difficulty: 'Beginner',
        rating: 4.5,
        downloads: 10200,
        tags: ["Blank", "Custom"],
        includedWidgets: [],
        setupTime: "1 min"
    },
    {
        id: 'sales_review',
        name: 'Weekly Sales Review',
        description: 'Comprehensive sales performance tracking with KPIs, trends, and team metrics.',
        category: 'Sales',
        requiredFields: [
            { id: 'date', displayName: 'Order Date', description: 'A date column for time series analysis.', required: true, type: FieldType.DATETIME },
            { id: 'sales', displayName: 'Sales Amount', description: 'The primary revenue or sales metric.', required: true, type: FieldType.MEASURE },
            { id: 'profit', displayName: 'Profit Amount', description: 'The primary profit metric.', required: true, type: FieldType.MEASURE },
            { id: 'region', displayName: 'Region', description: 'A geographical dimension like State or Region.', required: true, type: FieldType.DIMENSION },
            { id: 'category', displayName: 'Product Category', description: 'A dimension for product categories.', required: true, type: FieldType.DIMENSION },
            { id: 'customer_name', displayName: 'Customer Name', description: 'The name of the customer.', required: true, type: FieldType.DIMENSION },
            { id: 'product_name', displayName: 'Product Name', description: 'The name of the product.', required: true, type: FieldType.DIMENSION },
        ],
        page: {
            name: 'Weekly Sales Review',
            widgets: [
                { id: 'sr_w1', title: 'Total Sales', chartType: ChartType.KPI, shelves: { values: [{id:'sr_p1', name:'{{sales}}', aggregation: AggregationType.SUM, type: FieldType.MEASURE, simpleName:'Sales'}] }, subtotalSettings: { rows: false, columns: false, grandTotal: true } } as any,
                { id: 'sr_w2', title: 'Total Profit', chartType: ChartType.KPI, shelves: { values: [{id:'sr_p2', name:'{{profit}}', aggregation: AggregationType.SUM, type: FieldType.MEASURE, simpleName:'Profit'}] }, subtotalSettings: { rows: false, columns: false, grandTotal: true } } as any,
                { id: 'sr_w3', title: 'Sales Trend', chartType: ChartType.AREA, shelves: { rows: [{id:'sr_p3', name:'{{date}}', type: FieldType.DATETIME, simpleName:'Date'}], values: [{id:'sr_p4', name:'{{sales}}', aggregation: AggregationType.SUM, type: FieldType.MEASURE, simpleName:'Sales'}] }, subtotalSettings: { rows: false, columns: false, grandTotal: true } } as any,
                { id: 'sr_w4', title: 'Sales by Region', chartType: ChartType.BAR, shelves: { rows: [{id:'sr_p5', name:'{{region}}', type: FieldType.DIMENSION, simpleName:'Region'}], values: [{id:'sr_p6', name:'{{sales}}', aggregation: AggregationType.SUM, type: FieldType.MEASURE, simpleName:'Sales'}] }, subtotalSettings: { rows: false, columns: false, grandTotal: true } } as any,
                { id: 'sr_w5', title: 'Profit by Category', chartType: ChartType.BAR, shelves: { rows: [{id:'sr_p7', name:'{{category}}', type: FieldType.DIMENSION, simpleName:'Category'}], values: [{id:'sr_p8', name:'{{profit}}', aggregation: AggregationType.SUM, type: FieldType.MEASURE, simpleName:'Profit'}] }, subtotalSettings: { rows: false, columns: false, grandTotal: true } } as any,
                { id: 'sr_w6', title: 'Top 10 Customers by Sales', chartType: ChartType.TABLE, shelves: { rows: [{id:'sr_p9', name:'{{customer_name}}', type: FieldType.DIMENSION, simpleName:'Customer Name'}], values: [{id:'sr_p10', name:'{{sales}}', aggregation: AggregationType.SUM, type: FieldType.MEASURE, simpleName:'Sales'}] }, subtotalSettings: { rows: false, columns: false, grandTotal: true } } as any,
                { id: 'sr_w7', title: 'Product Performance', chartType: ChartType.TABLE, shelves: { rows: [{id:'sr_p11', name:'{{product_name}}', type: FieldType.DIMENSION, simpleName:'Product Name'}], values: [{id:'sr_p12', name:'{{sales}}', aggregation: AggregationType.SUM, type: FieldType.MEASURE, simpleName:'Sales'}, {id:'sr_p13', name:'{{profit}}', aggregation: AggregationType.SUM, type: FieldType.MEASURE, simpleName:'Profit'}] }, subtotalSettings: { rows: false, columns: false, grandTotal: true } } as any,
            ],
            layouts: {
                lg: [
                    { i: 'sr_w1', x: 0, y: 0, w: 4, h: 4 }, { i: 'sr_w2', x: 4, y: 0, w: 4, h: 4 },
                    { i: 'sr_w3', x: 8, y: 0, w: 16, h: 8 }, { i: 'sr_w4', x: 0, y: 4, w: 8, h: 8 },
                    { i: 'sr_w5', x: 0, y: 12, w: 8, h: 8 }, { i: 'sr_w6', x: 8, y: 8, w: 16, h: 12 },
                    { i: 'sr_w7', x: 0, y: 20, w: 24, h: 12 },
                ]
            }
        },
        difficulty: 'Intermediate',
        rating: 4.8,
        downloads: 1247,
        tags: ["Revenue", "Performance", "Weekly"],
        includedWidgets: ["Revenue Trend", "Sales by Product", "Top Performers", "+4 more"],
        setupTime: "5 min"
    },
    {
        id: 'marketing_perf',
        name: 'Marketing Campaign ROI',
        description: 'Track campaign performance, customer acquisition costs, and conversion rates.',
        category: 'Marketing',
        requiredFields: [
            { id: 'date', displayName: 'Date', description: 'A date field for tracking performance over time.', required: true, type: FieldType.DATETIME },
            { id: 'campaign', displayName: 'Campaign Name', description: 'The name of the marketing campaign.', required: true, type: FieldType.DIMENSION },
            { id: 'impressions', displayName: 'Impressions', description: 'Number of times content was displayed.', required: true, type: FieldType.MEASURE },
            { id: 'clicks', displayName: 'Clicks', description: 'Number of clicks on the campaign.', required: true, type: FieldType.MEASURE },
            { id: 'conversions', displayName: 'Conversions', description: 'Number of successful conversions.', required: true, type: FieldType.MEASURE },
            { id: 'cost', displayName: 'Cost', description: 'Total cost of the campaign.', required: true, type: FieldType.MEASURE },
            { id: 'revenue', displayName: 'Revenue', description: 'Total revenue generated from the campaign.', required: true, type: FieldType.MEASURE },
        ],
        page: {
            name: 'Marketing Performance',
            widgets: [
                { id: 'mp_w1', title: 'Total Spend', chartType: ChartType.KPI, shelves: { values: [{id:'mp_p1', name:'{{cost}}', simpleName:'Cost', type:FieldType.MEASURE, aggregation:AggregationType.SUM}] }, subtotalSettings: { rows: false, columns: false, grandTotal: true } } as any,
                { id: 'mp_w2', title: 'Total Revenue', chartType: ChartType.KPI, shelves: { values: [{id:'mp_p2', name:'{{revenue}}', simpleName:'Revenue', type:FieldType.MEASURE, aggregation:AggregationType.SUM}] }, subtotalSettings: { rows: false, columns: false, grandTotal: true } } as any,
                { id: 'mp_w3', title: 'Revenue vs Cost by Campaign', chartType: ChartType.BAR, shelves: { rows: [{id:'mp_p3', name:'{{campaign}}', simpleName:'Campaign', type:FieldType.DIMENSION}], values: [{id:'mp_p4', name:'{{revenue}}', simpleName:'Revenue', type:FieldType.MEASURE, aggregation:AggregationType.SUM}, {id:'mp_p5', name:'{{cost}}', simpleName:'Cost', type:FieldType.MEASURE, aggregation:AggregationType.SUM}] }, subtotalSettings: { rows: false, columns: false, grandTotal: true } } as any,
                { id: 'mp_w4', title: 'Conversions Over Time', chartType: ChartType.LINE, shelves: { rows: [{id:'mp_p6', name:'{{date}}', simpleName:'Date', type:FieldType.DATETIME}], values: [{id:'mp_p7', name:'{{conversions}}', simpleName:'Conversions', type:FieldType.MEASURE, aggregation:AggregationType.SUM}] }, subtotalSettings: { rows: false, columns: false, grandTotal: true } } as any,
                { id: 'mp_w5', title: 'Impressions vs. Clicks', chartType: ChartType.SCATTER, shelves: { columns: [{id:'mp_p8', name:'{{impressions}}', simpleName:'Impressions', type:FieldType.MEASURE}], rows: [{id:'mp_p9', name:'{{clicks}}', simpleName:'Clicks', type:FieldType.MEASURE}], category: [{id:'mp_p10', name:'{{campaign}}', simpleName:'Campaign', type:FieldType.DIMENSION}] }, subtotalSettings: { rows: false, columns: false, grandTotal: true } } as any,
                { id: 'mp_w6', title: 'Campaign Performance', chartType: ChartType.TABLE, shelves: { rows: [{id:'mp_p11', name:'{{campaign}}', simpleName:'Campaign', type:FieldType.DIMENSION}], values: [{id:'mp_p12', name:'{{impressions}}', simpleName:'Impressions', type:FieldType.MEASURE, aggregation:AggregationType.SUM}, {id:'mp_p13', name:'{{clicks}}', simpleName:'Clicks', type:FieldType.MEASURE, aggregation:AggregationType.SUM}, {id:'mp_p14', name:'{{conversions}}', simpleName:'Conversions', type:FieldType.MEASURE, aggregation:AggregationType.SUM}, {id:'mp_p15', name:'{{cost}}', simpleName:'Cost', type:FieldType.MEASURE, aggregation:AggregationType.SUM}, {id:'mp_p16', name:'{{revenue}}', simpleName:'Revenue', type:FieldType.MEASURE, aggregation:AggregationType.SUM}] }, subtotalSettings: { rows: false, columns: false, grandTotal: true } } as any,
                { id: 'mp_w7', title: 'Daily Performance', chartType: ChartType.TABLE, shelves: { rows: [{id:'mp_p17', name:'{{date}}', simpleName:'Date', type:FieldType.DATETIME}], values: [{id:'mp_p18', name:'{{impressions}}', simpleName:'Impressions', type:FieldType.MEASURE, aggregation:AggregationType.SUM}, {id:'mp_p19', name:'{{clicks}}', simpleName:'Clicks', type:FieldType.MEASURE, aggregation:AggregationType.SUM}, {id:'mp_p20', name:'{{cost}}', simpleName:'Cost', type:FieldType.MEASURE, aggregation:AggregationType.SUM}] }, subtotalSettings: { rows: false, columns: false, grandTotal: true } } as any,
            ],
            layouts: {
                lg: [
                    { i: 'mp_w1', x: 0, y: 0, w: 6, h: 4 }, { i: 'mp_w2', x: 6, y: 0, w: 6, h: 4 },
                    { i: 'mp_w4', x: 12, y: 0, w: 12, h: 8 }, { i: 'mp_w3', x: 0, y: 4, w: 12, h: 8 },
                    { i: 'mp_w5', x: 12, y: 8, w: 12, h: 8 }, { i: 'mp_w6', x: 0, y: 12, w: 12, h: 12 },
                    { i: 'mp_w7', x: 12, y: 16, w: 12, h: 8 }
                ]
            }
        },
        difficulty: 'Intermediate',
        rating: 4.7,
        downloads: 892,
        tags: ["ROI", "Campaigns", "Attribution"],
        includedWidgets: ["Campaign Performance", "Cost per Acquisition", "Attribution Model", "+4 more"],
        setupTime: "10 min"
    },
    {
        id: 'finance_health',
        name: 'Financial Health Overview',
        description: 'A summary of financial performance, including revenue, expenses, and profitability analysis.',
        category: 'Finance',
        requiredFields: [
            { id: 'date', displayName: 'Date', description: 'A date column for monthly or quarterly analysis.', required: true, type: FieldType.DATETIME },
            { id: 'account', displayName: 'Account/Category', description: 'The financial account or category (e.g., Revenue, COGS).', required: true, type: FieldType.DIMENSION },
            { id: 'amount', displayName: 'Amount', description: 'The financial value for each transaction.', required: true, type: FieldType.MEASURE },
        ],
        page: {
            name: 'Financial Health',
             widgets: [
                { id: 'fh_w1', title: 'Financial Summary', chartType: ChartType.TABLE, shelves: { rows: [{id:'fh_p1', name:'{{account}}', simpleName:'Account', type: FieldType.DIMENSION}], values: [{id:'fh_p2', name:'{{amount}}', simpleName:'Amount', type: FieldType.MEASURE, aggregation: AggregationType.SUM}]} , subtotalSettings: { rows: false, columns: false, grandTotal: true }} as any,
                { id: 'fh_w2', title: 'Financials Over Time', chartType: ChartType.BAR, shelves: { rows: [{id:'fh_p3', name:'{{date}}', simpleName:'Date', type: FieldType.DATETIME}], columns: [{id:'fh_p4', name:'{{account}}', simpleName:'Account', type: FieldType.DIMENSION}], values: [{id:'fh_p5', name:'{{amount}}', simpleName:'Amount', type: FieldType.MEASURE, aggregation: AggregationType.SUM}]} , subtotalSettings: { rows: false, columns: false, grandTotal: true }} as any,
            ],
            layouts: {
                lg: [
                    { i: 'fh_w1', x: 0, y: 0, w: 8, h: 12 },
                    { i: 'fh_w2', x: 8, y: 0, w: 16, h: 12 },
                ]
            }
        },
        difficulty: 'Intermediate',
        rating: 4.6,
        downloads: 650,
        tags: ["Finance", "P&L", "Expenses"],
        includedWidgets: ["Financial Summary", "Income vs Expense"],
        setupTime: "10 min"
    },
    {
        id: 'operations_kpi',
        name: 'Operations KPI Dashboard',
        description: 'Monitor key operational metrics like ticket volume, resolution time, and customer satisfaction.',
        category: 'Operations',
        requiredFields: [
            { id: 'ticket_id', displayName: 'Ticket ID', description: 'Unique identifier for each ticket.', required: true, type: FieldType.DIMENSION },
            { id: 'creation_date', displayName: 'Creation Date', description: 'The date a support ticket was created.', required: true, type: FieldType.DATETIME },
            { id: 'agent_name', displayName: 'Agent Name', description: 'The name of the support agent.', required: true, type: FieldType.DIMENSION },
            { id: 'status', displayName: 'Status', description: 'Current status of the ticket (e.g. Open, Closed).', required: true, type: FieldType.DIMENSION },
            { id: 'priority', displayName: 'Priority', description: 'Priority level of the ticket (e.g. High, Low).', required: true, type: FieldType.DIMENSION },
            { id: 'csat_score', displayName: 'CSAT Score', description: 'Customer satisfaction score (1-5).', required: true, type: FieldType.MEASURE },
        ],
        page: {
            name: 'Operations KPI Dashboard',
            widgets: [
                { id: 'ok_w1', title: 'Total Tickets', chartType: ChartType.KPI, shelves: { values: [{ id: 'ok_p1', name: '{{ticket_id}}', simpleName: 'Ticket ID', type: FieldType.DIMENSION, aggregation: AggregationType.COUNT }] }, subtotalSettings: { rows: false, columns: false, grandTotal: true } } as any,
                { id: 'ok_w2', title: 'Average CSAT', chartType: ChartType.KPI, shelves: { values: [{ id: 'ok_p2', name: '{{csat_score}}', simpleName: 'CSAT Score', type: FieldType.MEASURE, aggregation: AggregationType.AVERAGE }] }, subtotalSettings: { rows: false, columns: false, grandTotal: true } } as any,
                { id: 'ok_w3', title: 'Tickets Created Over Time', chartType: ChartType.LINE, shelves: { rows: [{ id: 'ok_p3', name: '{{creation_date}}', simpleName: 'Creation Date', type: FieldType.DATETIME }], values: [{ id: 'ok_p4', name: '{{ticket_id}}', simpleName: 'Ticket ID', type: FieldType.DIMENSION, aggregation: AggregationType.COUNT }] }, subtotalSettings: { rows: false, columns: false, grandTotal: true } } as any,
                { id: 'ok_w4', title: 'Tickets by Priority', chartType: ChartType.PIE, shelves: { rows: [{ id: 'ok_p5', name: '{{priority}}', simpleName: 'Priority', type: FieldType.DIMENSION }], values: [{ id: 'ok_p6', name: '{{ticket_id}}', simpleName: 'Ticket ID', type: FieldType.DIMENSION, aggregation: AggregationType.COUNT }] }, subtotalSettings: { rows: false, columns: false, grandTotal: true } } as any,
                { id: 'ok_w5', title: 'Tickets per Agent', chartType: ChartType.BAR, shelves: { rows: [{ id: 'ok_p7', name: '{{agent_name}}', simpleName: 'Agent Name', type: FieldType.DIMENSION }], values: [{ id: 'ok_p8', name: '{{ticket_id}}', simpleName: 'Ticket ID', type: FieldType.DIMENSION, aggregation: AggregationType.COUNT }] }, subtotalSettings: { rows: false, columns: false, grandTotal: true } } as any,
                { id: 'ok_w6', title: 'Recent Tickets', chartType: ChartType.TABLE, shelves: { rows: [{ id: 'ok_p9', name: '{{creation_date}}', simpleName: 'Creation Date', type: FieldType.DATETIME }, { id: 'ok_p10', name: '{{agent_name}}', simpleName: 'Agent Name', type: FieldType.DIMENSION }, { id: 'ok_p11', name: '{{priority}}', simpleName: 'Priority', type: FieldType.DIMENSION }, { id: 'ok_p12', name: '{{status}}', simpleName: 'Status', type: FieldType.DIMENSION }] }, subtotalSettings: { rows: false, columns: false, grandTotal: true } } as any,
                { id: 'ok_w7', title: 'Agent Performance', chartType: ChartType.TABLE, shelves: { rows: [{ id: 'ok_p13', name: '{{agent_name}}', simpleName: 'Agent Name', type: FieldType.DIMENSION }], values: [{ id: 'ok_p14', name: '{{ticket_id}}', simpleName: 'Ticket ID', type: FieldType.DIMENSION, aggregation: AggregationType.COUNT }, { id: 'ok_p15', name: '{{csat_score}}', simpleName: 'CSAT Score', type: FieldType.MEASURE, aggregation: AggregationType.AVERAGE }] }, subtotalSettings: { rows: false, columns: false, grandTotal: true } } as any,
            ],
            layouts: {
                lg: [
                    { i: 'ok_w1', x: 0, y: 0, w: 6, h: 4 }, { i: 'ok_w2', x: 6, y: 0, w: 6, h: 4 },
                    { i: 'ok_w3', x: 12, y: 0, w: 12, h: 8 }, { i: 'ok_w4', x: 0, y: 4, w: 6, h: 8 },
                    { i: 'ok_w5', x: 6, y: 4, w: 6, h: 8 }, { i: 'ok_w7', x: 0, y: 12, w: 12, h: 10 },
                    { i: 'ok_w6', x: 12, y: 8, w: 12, h: 14 }
                ]
            }
        },
        difficulty: 'Intermediate',
        rating: 4.5,
        downloads: 430,
        tags: ["Operations", "Logistics", "KPI"],
        includedWidgets: ["Ticket Volume", "Resolution Time", "Agent Performance", "CSAT Score"],
        setupTime: "15 min"
    },
    {
        id: 'hr_analytics',
        name: 'HR Analytics',
        description: 'Track key people metrics including headcount, diversity, turnover, and recruiting efforts.',
        category: 'HR Analytics',
        requiredFields: [
            { id: 'employee_id', displayName: 'Employee ID', description: 'Unique identifier for each employee.', required: true, type: FieldType.DIMENSION },
            { id: 'department', displayName: 'Department', description: 'The employee\'s department.', required: true, type: FieldType.DIMENSION },
            { id: 'start_date', displayName: 'Start Date', description: 'The date the employee was hired.', required: true, type: FieldType.DATETIME },
            { id: 'gender', displayName: 'Gender', description: 'The employee\'s gender.', required: true, type: FieldType.DIMENSION },
            { id: 'salary', displayName: 'Salary', description: 'The employee\'s annual salary.', required: true, type: FieldType.MEASURE },
        ],
        page: {
            name: 'HR Analytics Dashboard',
            widgets: [
                { id: 'hr_w1', title: 'Total Headcount', chartType: ChartType.KPI, shelves: { values: [{ id: 'hr_p1', name: '{{employee_id}}', simpleName: 'Employee ID', type: FieldType.DIMENSION, aggregation: AggregationType.COUNT }] }, subtotalSettings: { rows: false, columns: false, grandTotal: true } } as any,
                { id: 'hr_w2', title: 'Average Salary', chartType: ChartType.KPI, shelves: { values: [{ id: 'hr_p2', name: '{{salary}}', simpleName: 'Salary', type: FieldType.MEASURE, aggregation: AggregationType.AVERAGE }] }, subtotalSettings: { rows: false, columns: false, grandTotal: true } } as any,
                { id: 'hr_w3', title: 'Headcount by Department', chartType: ChartType.BAR, shelves: { rows: [{ id: 'hr_p3', name: '{{department}}', simpleName: 'Department', type: FieldType.DIMENSION }], values: [{ id: 'hr_p4', name: '{{employee_id}}', simpleName: 'Employee ID', type: FieldType.DIMENSION, aggregation: AggregationType.COUNT }] }, subtotalSettings: { rows: false, columns: false, grandTotal: true } } as any,
                { id: 'hr_w4', title: 'Gender Diversity', chartType: ChartType.PIE, shelves: { rows: [{ id: 'hr_p5', name: '{{gender}}', simpleName: 'Gender', type: FieldType.DIMENSION }], values: [{ id: 'hr_p6', name: '{{employee_id}}', simpleName: 'Employee ID', type: FieldType.DIMENSION, aggregation: AggregationType.COUNT }] }, subtotalSettings: { rows: false, columns: false, grandTotal: true } } as any,
                { id: 'hr_w5', title: 'Hires Over Time', chartType: ChartType.LINE, shelves: { rows: [{ id: 'hr_p7', name: '{{start_date}}', simpleName: 'Start Date', type: FieldType.DATETIME }], values: [{ id: 'hr_p8', name: '{{employee_id}}', simpleName: 'Employee ID', type: FieldType.DIMENSION, aggregation: AggregationType.COUNT }] }, subtotalSettings: { rows: false, columns: false, grandTotal: true } } as any,
                { id: 'hr_w6', title: 'Employee List', chartType: ChartType.TABLE, shelves: { rows: [{ id: 'hr_p9', name: '{{employee_id}}', simpleName: 'Employee ID', type: FieldType.DIMENSION }, { id: 'hr_p10', name: '{{department}}', simpleName: 'Department', type: FieldType.DIMENSION }, { id: 'hr_p11', name: '{{start_date}}', simpleName: 'Start Date', type: FieldType.DATETIME }] }, subtotalSettings: { rows: false, columns: false, grandTotal: true } } as any,
                { id: 'hr_w7', title: 'Department Salary Overview', chartType: ChartType.TABLE, shelves: { rows: [{ id: 'hr_p12', name: '{{department}}', simpleName: 'Department', type: FieldType.DIMENSION }], values: [{ id: 'hr_p13', name: '{{employee_id}}', simpleName: 'Employee ID', type: FieldType.DIMENSION, aggregation: AggregationType.COUNT }, { id: 'hr_p14', name: '{{salary}}', simpleName: 'Salary', type: FieldType.MEASURE, aggregation: AggregationType.AVERAGE }] }, subtotalSettings: { rows: false, columns: false, grandTotal: true } } as any,
            ],
            layouts: {
                lg: [
                    { i: 'hr_w1', x: 0, y: 0, w: 6, h: 4 }, { i: 'hr_w2', x: 6, y: 0, w: 6, h: 4 },
                    { i: 'hr_w5', x: 12, y: 0, w: 12, h: 8 }, { i: 'hr_w3', x: 0, y: 4, w: 12, h: 8 },
                    { i: 'hr_w4', x: 12, y: 8, w: 12, h: 8 }, { i: 'hr_w7', x: 0, y: 12, w: 12, h: 10 },
                    { i: 'hr_w6', x: 12, y: 16, w: 12, h: 10 }
                ]
            }
        },
        difficulty: 'Beginner',
        rating: 4.7,
        downloads: 512,
        tags: ["HR", "People", "Headcount"],
        includedWidgets: ["Headcount Overview", "Diversity Metrics", "Turnover Rate", "Recruiting Funnel"],
        setupTime: "10 min"
    }
];