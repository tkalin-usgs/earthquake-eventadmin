'use strict';

var FileUploadView = require('FileUploadView'),
    Product = require('Product'),
    ProductContent = require('ProductContent'),
    ProductContentView = require('ProductContentView'),
    ProductContentEditView = require('ProductContentEditView'),

    Accordion = require('accordion/Accordion'),

    SendProductView = require('admin/SendProductView'),

    CollectionView = require('mvc/CollectionView'),
    ModalView = require('mvc/ModalView'),
    View = require('mvc/View'),

    Message = require('util/Message'),
    Util = require('util/Util');


var PRIORITY_PROPERTIES = {
  'region': {
    type: 'text',
    label: 'Region Name',
    help: 'This is the event title on the web',
    placeholder: '',
    format: null,
    validate: null
  },
  'eventsource': {
    type: 'text',
    label: 'Event Source',
    help: '',
    placeholder: '',
    format: null,
    validate: null
  },
  'eventsourcecode': {
    type: 'text',
    label: 'Event Source Code',
    help: '',
    placeholder: '',
    format: null,
    validate: null
  },
  'latitude': {
    type: 'number',
    label: 'Latitude',
    help: 'Decimal degrees. Use negative values for southern latitudes.',
    placeholder: '',
    format: null,
    validate: function (input) {
      try {
        parseFloat(input);
      } catch (e) {
        throw new Error('Latitude must be numeric');
      }
      return input;
    }
  },
  'longitude': {
    type: 'number',
    label: 'Longitude',
    help: 'Decimal degrees. Use negative values for western longitudes.',
    placeholder: '',
    format: null,
    validate: function (input) {
      try {
        parseFloat(input);
      } catch (e) {
        throw new Error('Longitude must be numeric');
      }
      return input;
    }
  },
  'eventtime': {
    type: 'text',
    label: 'Event Time',
    help: 'Event UTC time in ISO 8601 format',
    placeholder: 'yyyy-mm-ddTHH:ii:ss[.nnn]Z',
    format: null,
    validate: function (input) {
      var d;

      try {
        d = new Date(input);

        if (!(d instanceof Date)) {
          throw new Error();
        }
      } catch (e) {
        throw new Error('Input dates should be in ISO 8601 format.');
      }
      return input;
    }
  },
  'magnitude': {
    type: 'number',
    label: 'Magnitude',
    help: '',
    placeholder: '',
    format: null,
    validate: function (input) {
      try {
        parseFloat(input);
      } catch (e) {
        throw new Error('Magnitude must be numeric');
      }
      return input;
    }
  },
  'depth': {
    type: 'number',
    label: 'Depth',
    help: 'Event depth in kilometers',
    placeholder: '',
    format: null,
    validate: function (input) {
      try {
        parseFloat(input);
      } catch (e) {
        throw new Error('Depth must be numeric');
      }
      return input;
    }
  },
  'event-type': {
    type: 'text',
    label: 'Event Type',
    help: 'Any valid QuakeML EventType',
    placeholder: '',
    format: null,
    validate: null
  },
  'version': {
    type: 'text',
    label: 'Version',
    help: '',
    placeholder: '',
    format: null,
    validate: null
  }
};


var EditProductView = function (options) {
  var _this,
      _initialize,

      _accordion,
      _codeInput,
      _contentErrorsEl,
      _contentInput,
      _contentsView,
      _contentTypeInput,
      _dialog,
      _fileUploadView,
      _linksInput,
      _newContent,
      _newContentView,
      _priorityInputs,
      _product,
      _propertiesInput,
      _sendProductView,
      _sourceInput,
      _statusInput,
      _typeInput,
      _uploadView,

      _addContent,
      _createInput,
      _createViewSkeleton,
      _createViewSkeletonBasic,
      _createViewSkeletonContents,
      _createViewSkeletonLinks,
      _createViewSkeletonPriority,
      _createViewSkeletonProperties,
      _onCancel,
      _onCreate,
      _onFileUpload,
      _onNewContentClick,
      _onNewContentViewHide,
      _parsePropertyInput,
      _renderBasic,
      _renderLinks,
      _renderPriority,
      _renderProperties,
      _validateBasic,
      _validateFiles,
      _validateLinks,
      _validatePriority,
      _validateProperties;


  _this = View(options);

  _initialize = function (options) {
    var dialogTitle = 'Edit Product';

    _product = options.product;
    _priorityInputs = {};

    if (!_product) {
      _product = Product();
      dialogTitle = 'Create Product';
    }

    _createViewSkeleton();

    _dialog = ModalView(_this.el, {
      buttons: [
        {
          callback: _onCreate,
          classes: ['editproduct-create', 'green', 'confirm'],
          text: 'Review and Send'
        },
        {
          callback: _onCancel,
          classes: ['editproduct-cancel'],
          text: 'Cancel'
        }
      ],
      closable: false,
      title: dialogTitle
    });

    _this.render();
  };


  _addContent = function (content) {
    var contents,
        ids;

    contents = _product.get('contents');
    ids = contents.getIds(true);

    if (ids.hasOwnProperty(content.get('id'))) {
      Message({
        container: _contentErrorsEl,
        content: 'Can not add content with duplicate path. Offending path ' +
            'was: &ldquo;' + content.get('id') + '&rdquo;',
        classes: ['error']
      });
    } else {
     contents.add(content);
    }
  };

  _createInput = function (key, info) {
    var container = document.createDocumentFragment(),
        help = null,
        id = 'editproduct-' + key,
        input,
        label;

    label = container.appendChild(document.createElement('label'));
    label.setAttribute('for', id);
    label.innerHTML = info.label;
    if (info.help) {
      help = label.appendChild(document.createElement('small'));
      help.innerHTML = info.help;
    }

    input = container.appendChild(document.createElement('input'));
    input.setAttribute('id', id);
    input.setAttribute('type', info.type);
    input.classList.add(id);
    if (info.placeholder) {
      input.setAttribute('placeholder', info.placeholder);
    }

    _priorityInputs[key] = Util.extend({}, info);
    _priorityInputs[key].input = input;

    return container;
  };

  _createViewSkeleton = function () {
    _this.el.classList.add('editproduct');
    _this.el.classList.add('vertical');

    _accordion = Accordion({
      el: _this.el,
      accordions: [
        {
          toggleText: 'Required Information',
          toggleElement: 'h3',
          classes: 'accordion-standard editproduct-basic-wrapper',
          content: _createViewSkeletonBasic()
        },
        {
          toggleText: 'Event Information',
          toggleElement: 'h3',
          classes: 'accordion-standard editproduct-priority-wrapper',
          content: _createViewSkeletonPriority()
        },
        {
          toggleText: 'Additional Properties',
          toggleElement: 'h3',
          classes: 'accordion-standard accordion-closed ' +
              'editproduct-properties-wrapper',
          content: _createViewSkeletonProperties()
        },
        {
          toggleText: 'Links',
          toggleElement: 'h3',
          classes: 'accordion-standard accordion-closed ' +
              'editproduct-links-wrapper',
          content: _createViewSkeletonLinks()
        },
        {
          toggleText: 'Files/Content',
          toggleElement: 'h3',
          classes: 'accordion-standard accordion-closed ' +
              'editproduct-files-wrapper',
          content: _createViewSkeletonContents()
        }
      ]
    });
  };

  _createViewSkeletonBasic = function () {
      var fragment,
          codeHelp,
          codeLabel,
          sourceLabel,
          statusLabel,
          statusHelp,
          typeLabel;

      fragment = document.createDocumentFragment();

      sourceLabel = fragment.appendChild(document.createElement('label'));
      sourceLabel.setAttribute('for', 'editproduct-source');
      sourceLabel.innerHTML = 'Source';
      _sourceInput = fragment.appendChild(document.createElement('input'));
      _sourceInput.setAttribute('type', 'text');
      _sourceInput.setAttribute('id', 'editproduct-source');
      _sourceInput.classList.add('editproduct-source');

      typeLabel = fragment.appendChild(document.createElement('label'));
      typeLabel.setAttribute('for', 'editproduct-type');
      typeLabel.innerHTML = 'Type';
      _typeInput = fragment.appendChild(document.createElement('input'));
      _typeInput.setAttribute('type', 'text');
      _typeInput.setAttribute('id', 'editproduct-type');
      _typeInput.classList.add('editproduct-type');

      codeLabel = fragment.appendChild(document.createElement('label'));
      codeLabel.setAttribute('for', 'editproduct-code');
      codeLabel.innerHTML = 'Code';
      codeHelp = codeLabel.appendChild(document.createElement('small'));
      codeHelp.innerHTML = 'Unique codes (within a source and type) define ' +
          'unique products';
      _codeInput = fragment.appendChild(document.createElement('input'));
      _codeInput.setAttribute('type', 'text');
      _codeInput.setAttribute('id', 'editproduct-code');
      _codeInput.classList.add('editproduct-code');

      statusLabel = fragment.appendChild(document.createElement('label'));
      statusLabel.setAttribute('for', 'editproduct-status');
      statusLabel.innerHTML = 'Status';
      statusHelp = statusLabel.appendChild(document.createElement('small'));
      statusHelp.innerHTML = 'Use &ldquo;DELETE&rdquo; to delete this product';
      _statusInput = fragment.appendChild(document.createElement('input'));
      _statusInput.setAttribute('type', 'text');
      _statusInput.setAttribute('id', 'editproduct-status');
      _statusInput.classList.add('editproduct-status');

      return fragment;
  };

  _createViewSkeletonContents = function () {
    var existing,
        fragment,
        header;

    fragment = document.createDocumentFragment();

    existing = fragment.appendChild(document.createElement('ul'));
    existing.classList.add('editproduct-files-existing');

    _contentsView = CollectionView({
      collection: _product.get('contents'),
      el: existing,
      factory: ProductContentView
    });

    _contentErrorsEl = fragment.appendChild(document.createElement('div'));

    header = fragment.appendChild(document.createElement('h4'));
    header.innerHTML = 'Add New Content';

    _fileUploadView = FileUploadView({
      el: fragment.appendChild(document.createElement('div')),
      hideOnSuccess: true
    });

    _fileUploadView.on('upload', _onFileUpload);

    _newContent = fragment.appendChild(document.createElement('button'));
    _newContent.innerHTML = 'Create Inline Content';
    _newContent.classList.add('green');
    _newContent.classList.add('editproduct-new-content');
    _newContent.addEventListener('click', _onNewContentClick);

    return fragment;
  };

  _createViewSkeletonLinks = function () {
    var fragment,
        intro;

    fragment = document.createDocumentFragment();
    intro = fragment.appendChild(document.createElement('p'));
    intro.classList.add('alert');
    intro.classList.add('info');
    intro.innerHTML =
      'This section allows you to define relations to resources at ' +
      'arbitrary URIs. Each link relation should be on its own line. Link ' +
      'relations need not be unique. The format for each link relation is ' +
      'as follows: <code><em>relation</em> = <em>URI</em></code>.';

    _linksInput = fragment.appendChild(document.createElement('textarea'));
    _linksInput.setAttribute('aria-label', 'Link Relations');
    _linksInput.classList.add('editproduct-links');

    return fragment;
  };

  _createViewSkeletonPriority = function () {
    var fragment,
        intro,
        key;

    fragment = document.createDocumentFragment();

    intro = fragment.appendChild(document.createElement('p'));
    intro.classList.add('alert');
    intro.classList.add('info');
    intro.innerHTML =
      'All fields in this section are <strong>optional</strong>. In order ' +
      'to get this product to properly associate to an event, you ' +
      'probably want to provide either:' +
      '<ul class="editproduct-helplist"><li>' +
        'event id properties (&ldquo;Event Source&rdquo; and ' +
        '&ldquo;Event Source Code&rdquo;)' +
      '</li></ul>' +
      'OR' +
      '<ul class="editproduct-helplist"><li>' +
        'hypocenter properties (&ldquo;Latitude&rdquo;, &ldquo;Longitude' +
        '&rdquo;, and &ldquo;Event Time&rdquo;)' +
      '</li></ul>';


    for (key in PRIORITY_PROPERTIES) {
      fragment.appendChild(_createInput(key, PRIORITY_PROPERTIES[key]));
    }

    return fragment;
  };

  _createViewSkeletonProperties = function () {
    var fragment,
        intro;

   fragment = document.createDocumentFragment();

    intro = fragment.appendChild(document.createElement('p'));
    intro.classList.add('alert');
    intro.classList.add('info');
    intro.innerHTML =
      'This section allows you to define any arbitrary properties. Each ' +
      'property should be listed on its own line. The format for each line ' +
      'is: <code><em>name</em> = <em>value</em></code>. Property ' +
      'names/values may not contain and equals character. ' +
      'A property may have an empty value. To delete a property, remove ' +
      'the line corresponding to that property in the text area below.';

    _propertiesInput = fragment.appendChild(document.createElement('textarea'));
    _propertiesInput.setAttribute('aria-label', 'Additional Properties');
    _propertiesInput.classList.add('editproduct-properties');

    return fragment;
  };


  /**
   * Callback called when the "Cancel" button is clicked.
   *
   */
  _onCancel = function () {
    _dialog.hide();
  };

  /**
   * Callback called when the "Send" button is clicked.
   *
   */
  _onCreate = function () {
    var errors,
        fileVals,
        linkVals,
        propertyVals,
        rawVals;

    errors = [];

    try { rawVals = _validateBasic(); }
        catch (e) { errors.push(e); }
    try { propertyVals = _validatePriority(); }
        catch (e) { errors.push(e); }
    try { propertyVals = _validateProperties(propertyVals); }
        catch (e) { errors.push(e); }
    try { linkVals = _validateLinks(); }
        catch (e) { errors.push(e); }
    try { fileVals = _validateFiles(); }
        catch (e) { errors.push(e); }

    if (errors.length === 0) {
      rawVals.properties = propertyVals;
      rawVals.contents = fileVals;
      rawVals.links = linkVals;

      _product.set(rawVals);

      if (_sendProductView) {
        _sendProductView.off('done', _this.hide);
        _sendProductView.destroy();
        _sendProductView = null;
      }

      _sendProductView = SendProductView({
        products: [_product]
      });
      _sendProductView.on('done', _this.hide);

      _sendProductView.show();
    } else {
      ModalView('One or more errors occurred when creating the product. ' +
          'Please review you input values and try again.' + errors.join('<br/>'), {
        title: 'Error Parsing Product',
        classes: ['modal-error'],
        buttons: [
          {
            text: 'Fix Inputs',
            callback: function (evt, modal) {
              modal.hide();
              modal.destroy();
            }
          }
        ]
      }).show();
    }
  };

  _onFileUpload = function (fileInfo) {
    _addContent(ProductContent({
      id: fileInfo.name,
      url: fileInfo.url,
      length: fileInfo.length,
      lastModified: fileInfo.lastModified,
      contentType: fileInfo.contentType
    }));
  };

  _onNewContentClick = function () {
    _newContentView = ProductContentEditView({
      model: ProductContent({bytes: ''})
    });
    _newContentView.on('hide', _onNewContentViewHide);
    _newContentView.on('complete', _addContent);
    _newContentView.show();
  };

  _onNewContentViewHide = function () {
    if (_newContentView) {
      _newContentView.destroy();
      _newContentView = null;
    }
  };

  _parsePropertyInput = function () {
    var properties;

    properties = {};

    _propertiesInput.value.split('\n').forEach(function (property) {
      var tokens = property.split('=');

      if (tokens.length !== 2) {
        throw new Error('Malformed product property ' +
            '&ldquo;' + property + '&rdquo;');
      }

      properties[tokens[0].trim()] = tokens[1].trim();
    });

    return properties;
  };

  _renderBasic = function () {
    _sourceInput.value = _product.get('source');
    _typeInput.value = _product.get('type');
    _codeInput.value = _product.get('code');
    _statusInput.value = _product.get('status');
  };

  _renderLinks = function () {
    var i,
        len,
        links = _product.get('links'),
        linkValues = [],
        relation,
        uri,
        uris;

    for (relation in links) {
      uris = links[relation];

      for (i = 0, len = uris.length; i < len; i++) {
        uri = uris[i];
        linkValues.push(relation + ' = ' + uri);
      }
    }

    _linksInput.value = linkValues.join('\n');
  };

  _renderPriority = function () {
    var key,
        priorityInput,
        properties;

    properties = _product.get('properties');

    for (key in _priorityInputs) {
      priorityInput = _priorityInputs[key];

      if (properties.hasOwnProperty(key)) {
        if (priorityInput.format) {
          priorityInput.input.value = priorityInput.format(properties[key]);
        } else {
          priorityInput.input.value = properties[key];
        }
      }
    }
  };

  _renderProperties = function () {
    var key,
        props,
        properties;

    props = _product.get('properties');
    properties = [];

    for (key in props) {
      if (!_priorityInputs.hasOwnProperty(key)) {
        properties.push(key + ' = ' + props[key]);
      }
    }
    _propertiesInput.value = properties.join('\n');
  };

  _validateBasic = function () {
    var basic,
        errors;

    errors = [];

    if (_sourceInput.value === '') {
      errors.push(new Error('Source is a required value.'));
    }
    if (_typeInput.value === '') {
      errors.push(new Error('Type is a required value.'));
    }
    if (_codeInput.value === '') {
      errors.push(new Error('Code is a required value.'));
    }
    if (_statusInput.value === '') {
      errors.push(new Error('Status is a required value.'));
    }

    if (errors.length === 0) {
      basic = {
        source: _sourceInput.value,
        type: _typeInput.value,
        code: _codeInput.value,
        status: _statusInput.value
      };
    } else {
      throw errors;
    }

    return basic;
  };

  _validateFiles = function () {
    var contents,
        errors;

    errors = [];
    contents = _product.get('contents');

    try {
      contents.getIds(true);
    } catch (e) {
      errors.push(e.getMessage());
    }

    // contents.data().forEach(function (content) {
    //   try {
    //     content.validate();
    //   } catch (e) {
    //     errors.push(e.getMessage());
    //   }
    // });

    if (errors.length !== 0) {
      throw errors;
    }

    return contents;
  };

  _validateLinks = function () {
    var errors,
        links;

    errors = [];
    links = {};

    _linksInput.value.split('\n').forEach(function (link) {
      var relation,
          tokens = link.split('='),
          uri;

      if (link.trim() === '') {
        return;
      }

      if (tokens.length < 2) {
        errors.push('Malformed link &ldquo;' + link + '&rdquo;');
      } else {
        relation = tokens[0].trim();
        uri = tokens.slice(1).join('=').trim();

        if (!links.hasOwnProperty(relation)) {
          links[relation] = [];
        }

        links[relation].push(uri);
      }
    });

    if (errors.length !== 0) {
      throw errors;
    }

    return links;
  };

  _validatePriority = function () {
    var errors,
        key,
        priorityInput,
        properties;

    errors = [];
    properties = {};

    for (key in _priorityInputs) {
      priorityInput = _priorityInputs[key];

      if (priorityInput.input.value === '') {
        continue;
      }

      if (priorityInput.validate) {
        try {
          properties[key] = priorityInput.validate(priorityInput.input.value);
        } catch (e) {
          errors.push(e.getMessage());
        }
      } else {
        properties[key] = priorityInput.input.value;
      }
    }

    if (errors.length !== 0) {
      throw errors;
    }

    return properties;
  };

  _validateProperties = function (properties) {
    var errors;

    errors = [];

    _propertiesInput.value.split('\n').forEach(function (property) {
      var key,
          tokens = property.split('='),
          value;

      if (property.trim() === '') {
        return;
      }

      if (tokens.length < 2) {
        errors.push('Malformed property &ldquo;' + property + '&rdquo;');
      } else {
        key = tokens[0].trim();
        value = tokens.slice(1).join('=').trim();

        if (!_priorityInputs.hasOwnProperty(key)) {
          properties[key] = value;
        } else {
          errors.push('Priority property &ldquo;' + key + '&rdquo; can not ' +
              'be overridden in general property section.');
        }
      }
    });

    if (errors.length !== 0) {
      throw errors;
    }

    return properties;
  };


  _this.destroy = Util.compose(function () {
    if (_accordion) {
      _accordion.destroy();
    }

    if (_dialog) {
      _dialog.destroy();
    }

    if (_fileUploadView) {
      _fileUploadView.off();
      _fileUploadView.destroy();
    }

    if (_newContent) {
      _newContent.removeEventListener('click', _onNewContentClick);
    }

    if (_sendProductView) {
      _sendProductView.off('done', _this.hide);
      _sendProductView.destroy();
    }


    _onNewContentViewHide();


    _accordion = null;
    _codeInput = null;
    _contentErrorsEl = null;
    _contentInput = null;
    _contentsView = null;
    _contentTypeInput = null;
    _dialog = null;
    _fileUploadView = null;
    _linksInput = null;
    _newContent = null;
    _newContentView = null;
    _priorityInputs = null;
    _product = null;
    _propertiesInput = null;
    _sendProductView = null;
    _sourceInput = null;
    _statusInput = null;
    _typeInput = null;
    _uploadView = null;

    _addContent = null;
    _createInput = null;
    _createViewSkeleton = null;
    _createViewSkeletonBasic = null;
    _createViewSkeletonContents = null;
    _createViewSkeletonLinks = null;
    _createViewSkeletonPriority = null;
    _createViewSkeletonProperties = null;
    _onCancel = null;
    _onCreate = null;
    _onFileUpload = null;
    _onNewContentClick = null;
    _onNewContentViewHide = null;
    _parsePropertyInput = null;
    _renderBasic = null;
    _renderLinks = null;
    _renderPriority = null;
    _renderProperties = null;
    _validateBasic = null;
    _validateFiles = null;
    _validateLinks = null;
    _validatePriority = null;
    _validateProperties = null;

    _initialize = null;
    _this = null;
  }, _this.destroy);

  _this.hide = function () {
    _dialog.hide();
  };

  _this.render = function () {
    _renderBasic();
    _renderPriority();
    _renderProperties();
    _renderLinks();
  };

  _this.show = function () {
    _dialog.show();
  };


  _initialize(options);
  options = null;
  return _this;
};

module.exports = EditProductView;
