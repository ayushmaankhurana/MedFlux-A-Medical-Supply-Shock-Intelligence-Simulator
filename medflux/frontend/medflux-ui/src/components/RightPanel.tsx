import React from 'react';
import { useMedFlux } from '../store';
import { X, Trash2, Edit3 } from 'lucide-react';
export const RightPanel = () => {
  const {
    selectedEntity,
    setSelectedEntity,
    nodes,
    edges,
    updateNode,
    updateEdge,
    deleteEntity
  } = useMedFlux();
  if (!selectedEntity) return null;
  const isNode = selectedEntity.type === 'node';
  const entity = isNode ?
  nodes.find((n) => n.id === selectedEntity.id) :
  edges.find((e) => e.id === selectedEntity.id);
  if (!entity) return null;
  return (
    <div className="w-96 bg-medflux-panel border-l border-slate-800 flex flex-col h-full overflow-y-auto shrink-0 z-20 animate-in slide-in-from-right-8 duration-300">
      <div className="p-6 border-b border-slate-800 flex justify-between items-center sticky top-0 bg-medflux-panel z-10">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <Edit3 className="w-6 h-6 text-blue-400" />
          Edit {isNode ? 'Node' : 'Edge'}
        </h2>
        <button
          onClick={() => setSelectedEntity(null)}
          className="text-slate-400 hover:text-white p-2">
          
          <X className="w-6 h-6" />
        </button>
      </div>

      <div className="p-6 space-y-6">
        {isNode ?
        <>
            <Field
            label="Name"
            value={(entity as any).name}
            onChange={(v) =>
            updateNode(entity.id, {
              name: v
            })
            }
            type="text" />
          
            <div className="space-y-2">
              <label className="block text-base text-slate-400">Type</label>
              <select
              value={(entity as any).type}
              onChange={(e) =>
              updateNode(entity.id, {
                type: e.target.value as any
              })
              }
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 text-lg text-white focus:border-blue-500 outline-none">
              
                <option value="supplier">Supplier</option>
                <option value="manufacturer">Manufacturer</option>
                <option value="distributor">Distributor</option>
                <option value="hospital">Hospital</option>
              </select>
            </div>
            <Field
            label="Inventory"
            value={(entity as any).inventory}
            onChange={(v) =>
            updateNode(entity.id, {
              inventory: Number(v)
            })
            }
            type="number" />
          
            <Field
            label="Max Capacity"
            value={(entity as any).max_capacity}
            onChange={(v) =>
            updateNode(entity.id, {
              max_capacity: Number(v)
            })
            }
            type="number" />
          
            <Field
            label="Demand"
            value={(entity as any).demand}
            onChange={(v) =>
            updateNode(entity.id, {
              demand: Number(v)
            })
            }
            type="number" />
          
            <Field
            label="Processing Duration (Days)"
            value={(entity as any).processing_duration}
            onChange={(v) =>
            updateNode(entity.id, {
              processing_duration: Number(v)
            })
            }
            type="number" />
          

            <Field
            label="Fixed Upgrade Cost ($)"
            value={(entity as any).fixed_upgrade_cost}
            onChange={(v) =>
            updateNode(entity.id, {
              fixed_upgrade_cost: Number(v)
            })
            }
            type="number" />
          
            <Field
            label="Upgrade Capacity Boost"
            value={(entity as any).upgrade_capacity_boost}
            onChange={(v) =>
            updateNode(entity.id, {
              upgrade_capacity_boost: Number(v)
            })
            }
            type="number" />
          
            <Field
            label="Holding Cost / Unit ($)"
            value={(entity as any).holding_cost_per_unit}
            onChange={(v) =>
            updateNode(entity.id, {
              holding_cost_per_unit: Number(v)
            })
            }
            type="number" />
          
          </> :

        <>
            <div className="bg-slate-800 p-4 rounded-xl border border-slate-700 mb-6">
              <div className="text-slate-400 text-base mb-1">Source</div>
              <div className="text-white text-lg font-semibold truncate">
                {(entity as any).source}
              </div>
              <div className="text-slate-400 text-base mt-3 mb-1">Target</div>
              <div className="text-white text-lg font-semibold truncate">
                {(entity as any).target}
              </div>
            </div>
            <Field
            label="Capacity"
            value={(entity as any).capacity}
            onChange={(v) =>
            updateEdge(entity.id, {
              capacity: Number(v)
            })
            }
            type="number" />
          
            <Field
            label="Delivery Time (Days)"
            value={(entity as any).delivery_time}
            onChange={(v) =>
            updateEdge(entity.id, {
              delivery_time: Number(v)
            })
            }
            type="number" />
          
            <Field
            label="Shipping Cost / Unit"
            value={(entity as any).shipping_cost_per_unit}
            onChange={(v) =>
            updateEdge(entity.id, {
              shipping_cost_per_unit: Number(v)
            })
            }
            type="number" />
          
          </>
        }

        <div className="pt-8 border-t border-slate-800">
          <button
            onClick={deleteEntity}
            className="w-full flex items-center justify-center gap-2 bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/50 px-6 py-3 rounded-lg font-semibold text-lg transition-colors">
            
            <Trash2 className="w-5 h-5" />
            Delete Entity
          </button>
        </div>
      </div>
    </div>);

};
const Field = ({
  label,
  value,
  onChange,
  type





}: {label: string;value: string | number;onChange: (v: string) => void;type: string;}) =>
<div className="space-y-2">
    <label className="block text-base text-slate-400">{label}</label>
    <input
    type={type}
    value={value}
    onChange={(e) => onChange(e.target.value)}
    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 text-lg text-white focus:border-blue-500 outline-none" />
  
  </div>;