import checkDependencies from '../check-dependencies.js'

export default {

  schema: {
    id: {
      type: 'string',
      default: '10344b13-d981-47a0-90ac-f048ee2780a6'
    }
  },

  init: function () {
  },

  update: function () {
    var this_ = this
    var furnitureId = this_.data.id

    // check params
    if (!furnitureId || furnitureId === '') return

    // remove old mesh
    this_.remove()

    // create new one
    this_.mesh = new THREE.Object3D()
    this_.data3dView = new io3d.aFrame.three.Data3dView({parent: this_.mesh})

    // get furniture data
    io3d.furniture.get(furnitureId).then(function (result) {
      // Expose properties
      this_.info = result.info // lightweight info like name, manufacturer, description ...
      this_.data3d = result.data3d // geometries and materials

      // check for material presets in the furniture sceneStructure definition
      var materialPreset = this_.info.sceneStructure && JSON.parse(this_.info.sceneStructure).materials
      // Parse & expose materials
      this_.availableMaterials = {}
      Object.keys(result.data3d.meshes).forEach(function eachMesh (meshName) {
        this_.availableMaterials[meshName] = result.data3d.alternativeMaterialsByMeshKey ? result.data3d.alternativeMaterialsByMeshKey[meshName] : result.data3d.meshes[meshName].material

        //update material based on inspector
        var materialPropName = 'material_' + meshName.replace(/\s/g, '_')
        if (this_.data[materialPropName] !== undefined) {
          result.data3d.meshes[meshName].material = this_.data[materialPropName]
          this_.el.emit('material-changed', {mesh: meshName, material: this_.data[materialPropName]})
        } else if (materialPreset && materialPreset[meshName]) {
          // apply presets from the furniture's sceneStructure definition
          result.data3d.meshes[meshName].material = materialPreset[meshName]
          this_.el.emit('material-changed', {mesh: meshName, material: materialPreset[meshName]})
        } else {
          // register it as part of the schema for the inspector
          var prop = {}
          prop[materialPropName] = {
            type: 'string',
            default: result.data3d.meshes[meshName].material,
            oneOf: result.data3d.alternativeMaterialsByMeshKey ? result.data3d.alternativeMaterialsByMeshKey[meshName] : result.data3d.meshes[meshName].material
          }
          this_.extendSchema(prop)
          this_.data[materialPropName] = result.data3d.meshes[meshName].material
        }
      })

      // update view
      this_.data3dView.set(result.data3d)
      this_.el.data3d = result.data3d
      this_.el.setObject3D('mesh', this_.mesh)
      // emit event
      if (this_._prevId !== furnitureId) this_.el.emit('model-loaded', {format: 'data3d', model: this_.mesh});
      this_._prevId = furnitureId
    })
  },

  remove: function () {
    if (this.data3dView) {
      this.data3dView.destroy()
      this.data3dView = null
    }
    if (this.mesh) {
      this.el.removeObject3D('mesh')
      this.mesh = null
    }
  }

}
