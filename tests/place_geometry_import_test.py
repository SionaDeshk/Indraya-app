"""Offline geographic input validation, not native rendering acceptance."""
import importlib.util, pathlib, unittest, copy
root=pathlib.Path(__file__).resolve().parents[1]
spec=importlib.util.spec_from_file_location('geometry_import',root/'scripts/import-place-geometries.py')
module=importlib.util.module_from_spec(spec);spec.loader.exec_module(module)
class GeometryImportTests(unittest.TestCase):
 def test_holes_and_disconnected_parts_remain_unchanged(self):
  shape={'type':'MultiPolygon','coordinates':[[[[-150,60],[-149,60],[-149,61],[-150,60]],[[-149.8,60.1],[-149.7,60.1],[-149.7,60.2],[-149.8,60.1]]],[[[-148,60],[-147,60],[-147,61],[-148,60]]]]}
  before=copy.deepcopy(shape);self.assertEqual(module.validate_geometry(shape),12);self.assertEqual(shape,before)
 def test_open_rings_and_non_alaska_geometry_rejected(self):
  for ring in [[[-150,60],[-149,60],[-149,61],[-148,60]],[[0,0],[1,0],[1,1],[0,0]]]:
   with self.assertRaises(ValueError):module.validate_geometry({'type':'Polygon','coordinates':[ring]})
 def test_point_and_nonfinite_geometry_rejected(self):
  with self.assertRaises(ValueError):module.validate_geometry({'type':'Point','coordinates':[-149,61]})
  with self.assertRaises(ValueError):module.validate_geometry({'type':'Polygon','coordinates':[[[-150,60],[-149,60],[-149,float('nan')],[-150,60]]]})
 def test_identity_type_is_part_of_review(self):
  self.assertIn(('relation',12188016),module.APPROVED)
  self.assertNotIn(('way',12188016),module.APPROVED)
if __name__=='__main__':unittest.main()
